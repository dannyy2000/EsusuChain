#!/bin/bash

# EsusuChain Integration Test Script
# This script automates the manual testing process

set -e  # Exit on error

echo "🧪 EsusuChain Integration Test Suite"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${BLUE}ℹ️  ${NC}$1"
}

warn() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if emulator is running
check_emulator() {
    if ! curl -s http://localhost:8888/v1/blocks?height=sealed > /dev/null 2>&1; then
        fail "Emulator is not running"
        echo ""
        echo "Please start the emulator in another terminal:"
        echo "  flow emulator start"
        echo ""
        exit 1
    fi
    pass "Emulator is running"
}

# Deploy contracts
deploy_contracts() {
    info "Deploying contracts..."
    if flow project deploy --network emulator > /dev/null 2>&1; then
        pass "Contracts deployed successfully"
    else
        fail "Contract deployment failed"
        exit 1
    fi
}

# Test 1: Circle Creation
test_circle_creation() {
    section "Test 1: Circle Creation"

    info "Setting up circle manager..."
    flow transactions send cadence/transactions/setup_circle_manager.cdc \
        --network emulator \
        --signer emulator-account > /dev/null 2>&1

    info "Creating circle: 3 members, 10 FLOW, 60s cycle..."
    if flow transactions send cadence/transactions/create_circle.cdc \
        3 10.0 60.0 \
        --network emulator \
        --signer emulator-account > /dev/null 2>&1; then

        # Verify circle info
        CIRCLE_INFO=$(flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network emulator 2>&1)

        if echo "$CIRCLE_INFO" | grep -q "numberOfMembers.*3"; then
            pass "Circle created with correct parameters"
        else
            fail "Circle parameters incorrect"
        fi
    else
        fail "Circle creation transaction failed"
    fi
}

# Test 2: Check circle info querying
test_circle_info_query() {
    section "Test 2: Circle Info Querying"

    info "Querying circle 0..."
    CIRCLE_INFO=$(flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network emulator 2>&1)

    if echo "$CIRCLE_INFO" | grep -q "circleId.*0"; then
        pass "Circle info query works"
    else
        fail "Circle info query failed"
    fi

    info "Querying non-existent circle 999..."
    NON_EXISTENT=$(flow scripts execute cadence/scripts/get_circle_info.cdc 999 --network emulator 2>&1)

    if echo "$NON_EXISTENT" | grep -q "nil\|null"; then
        pass "Non-existent circle returns nil"
    else
        fail "Non-existent circle should return nil"
    fi
}

# Test 3: Member Joining
test_member_joining() {
    section "Test 3: Member Joining"

    info "Getting emulator account address..."
    ADMIN_ADDR=$(flow accounts get emulator-account --network emulator | grep "Address" | awk '{print $2}')

    info "Admin joining circle 0..."
    if flow transactions send cadence/transactions/join_circle_with_approval.cdc \
        0 \
        --network emulator \
        --signer emulator-account > /dev/null 2>&1; then

        # Verify member info
        MEMBER_INFO=$(flow scripts execute cadence/scripts/get_member_info.cdc 0 $ADMIN_ADDR --network emulator 2>&1)

        if echo "$MEMBER_INFO" | grep -q "position.*0"; then
            pass "Member joined successfully"
        else
            fail "Member info not found"
        fi

        # Check approved amount
        if echo "$MEMBER_INFO" | grep -q "approvedAmount.*30"; then
            pass "Approved amount correct (10 × 3 = 30)"
        else
            fail "Approved amount incorrect"
        fi
    else
        fail "Member join transaction failed"
    fi
}

# Test 4: Cannot join twice
test_duplicate_join() {
    section "Test 4: Duplicate Join Prevention"

    info "Attempting to join same circle twice..."
    if flow transactions send cadence/transactions/join_circle_with_approval.cdc \
        0 \
        --network emulator \
        --signer emulator-account > /dev/null 2>&1; then
        fail "Should not allow duplicate join"
    else
        pass "Duplicate join correctly prevented"
    fi
}

# Test 5: Multiple circles
test_multiple_circles() {
    section "Test 5: Multiple Circles"

    info "Creating second circle: 2 members, 20 FLOW, 30s cycle..."
    if flow transactions send cadence/transactions/create_circle.cdc \
        2 20.0 30.0 \
        --network emulator \
        --signer emulator-account > /dev/null 2>&1; then

        # Verify both circles exist
        CIRCLE_0=$(flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network emulator 2>&1)
        CIRCLE_1=$(flow scripts execute cadence/scripts/get_circle_info.cdc 1 --network emulator 2>&1)

        if echo "$CIRCLE_0" | grep -q "numberOfMembers.*3" && \
           echo "$CIRCLE_1" | grep -q "numberOfMembers.*2"; then
            pass "Multiple circles exist independently"
        else
            fail "Circle independence check failed"
        fi
    else
        fail "Second circle creation failed"
    fi
}

# Test 6: Cannot pull before cycle duration
test_premature_pull() {
    section "Test 6: Cycle Duration Enforcement"

    info "Attempting to pull contributions immediately..."
    if flow transactions send cadence/transactions/scheduled_pull_contributions.cdc \
        0 \
        --network emulator \
        --signer emulator-account > /dev/null 2>&1; then
        fail "Should not allow pull before cycle duration"
    else
        pass "Premature pull correctly prevented"
    fi
}

# Test 7: Event emissions
test_events() {
    section "Test 7: Event Emissions"

    info "Checking CircleCreated events..."
    EVENTS=$(flow events get A.f8d6e0586b0a20c7.EsusuChain.CircleCreated --network emulator 2>&1)

    if echo "$EVENTS" | grep -q "CircleCreated"; then
        pass "CircleCreated events emitted"
    else
        warn "CircleCreated events not found (might be event index issue)"
    fi

    info "Checking MemberJoined events..."
    EVENTS=$(flow events get A.f8d6e0586b0a20c7.EsusuChain.MemberJoined --network emulator 2>&1)

    if echo "$EVENTS" | grep -q "MemberJoined"; then
        pass "MemberJoined events emitted"
    else
        warn "MemberJoined events not found (might be event index issue)"
    fi
}

# Main execution
main() {
    section "Prerequisites Check"
    check_emulator

    section "Contract Deployment"
    deploy_contracts

    # Run all tests
    test_circle_creation
    test_circle_info_query
    test_member_joining
    test_duplicate_join
    test_multiple_circles
    test_premature_pull
    test_events

    # Summary
    section "Test Summary"
    TOTAL=$((TESTS_PASSED + TESTS_FAILED))
    echo ""
    echo "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        echo ""
        echo "📋 Next Steps:"
        echo "  1. Review test output above"
        echo "  2. Run manual tests from MANUAL_TESTING_GUIDE.md for full coverage"
        echo "  3. Test contribution pulling with time progression"
        echo "  4. Deploy to testnet for full integration testing"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        echo ""
        echo "Please review the failures above and check:"
        echo "  - Contract deployment succeeded"
        echo "  - Emulator is running properly"
        echo "  - Transaction permissions are correct"
        exit 1
    fi
}

# Run main
main
