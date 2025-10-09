import Test
import BlockchainHelpers
import "EsusuChain"
import "FungibleToken"
import "FiatToken"

access(all) let admin = Test.getAccount(0x0000000000000007)
access(all) let alice = Test.createAccount()
access(all) let bob = Test.createAccount()
access(all) let charlie = Test.createAccount()
access(all) let diana = Test.createAccount()

access(all) fun setup() {
    // Deploy contracts
    let err = Test.deployContract(
        name: "EsusuChain",
        path: "../contracts/EsusuChain.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

// ========================================
// Circle Creation Tests
// ========================================

access(all) fun testCreateCircleManager() {
    let txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())
}

access(all) fun testCreateCircle() {
    // Setup circle manager first
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Create a circle with 4 members, 100.0 USDC contribution, 7 day cycle
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [4 as UInt64, 100.0, 604800.0], // 7 days in seconds
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Verify circle info
    let scriptResult = executeScript(
        "../scripts/get_circle_info.cdc",
        [0 as UInt64]
    )
    Test.expect(scriptResult, Test.beSucceeded())

    let circleInfo = scriptResult.returnValue! as! {String: AnyStruct}
    Test.assertEqual(4 as UInt64, circleInfo["numberOfMembers"]! as! UInt64)
    Test.assertEqual(100.0, circleInfo["contributionAmount"]! as! UFix64)
    Test.assertEqual(0 as UInt64, circleInfo["currentCycle"]! as! UInt64)
    Test.assertEqual(1, circleInfo["memberCount"]! as! Int) // Creator is first member
}

access(all) fun testCreateCircleWithInvalidParameters() {
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Try to create circle with only 1 member (should fail)
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [1 as UInt64, 100.0, 604800.0],
        alice
    )
    Test.expect(txResult, Test.beFailed())

    // Try to create circle with 0 contribution amount (should fail)
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [4 as UInt64, 0.0, 604800.0],
        alice
    )
    Test.expect(txResult, Test.beFailed())

    // Try to create circle with 0 cycle duration (should fail)
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [4 as UInt64, 100.0, 0.0],
        alice
    )
    Test.expect(txResult, Test.beFailed())
}

access(all) fun testJoinCircle() {
    // Setup and create circle
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [3 as UInt64, 50.0, 86400.0], // 3 members, 50 USDC, 1 day cycle
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Bob joins the circle
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        bob
    )
    Test.expect(txResult, Test.beSucceeded())

    // Charlie joins the circle
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        charlie
    )
    Test.expect(txResult, Test.beSucceeded())

    // Verify circle is now full
    let scriptResult = executeScript(
        "../scripts/get_circle_info.cdc",
        [0 as UInt64]
    )
    Test.expect(scriptResult, Test.beSucceeded())

    let circleInfo = scriptResult.returnValue! as! {String: AnyStruct}
    Test.assertEqual(3, circleInfo["memberCount"]! as! Int)

    // Verify member info for Bob
    let memberResult = executeScript(
        "../scripts/get_member_info.cdc",
        [0 as UInt64, bob.address]
    )
    Test.expect(memberResult, Test.beSucceeded())

    let memberInfo = memberResult.returnValue! as! EsusuChain.MemberInfo?
    Test.assert(memberInfo != nil, message: "Member info should exist")
    Test.assertEqual(bob.address, memberInfo!.address)
    Test.assertEqual(1 as UInt64, memberInfo!.position)
}

access(all) fun testCannotJoinFullCircle() {
    // Setup and create circle with 2 members
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [2 as UInt64, 50.0, 86400.0],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Bob joins (circle is now full)
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        bob
    )
    Test.expect(txResult, Test.beSucceeded())

    // Charlie tries to join (should fail - circle is full)
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        charlie
    )
    Test.expect(txResult, Test.beFailed())
}

access(all) fun testCannotJoinCircleTwice() {
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [3 as UInt64, 50.0, 86400.0],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Alice is already a member (creator), trying to join again should fail
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        alice
    )
    Test.expect(txResult, Test.beFailed())
}

// ========================================
// Contribution Tests
// ========================================

access(all) fun testSetupUSDCVault() {
    let txResult = executeTransaction(
        "../transactions/setup_usdc_vault.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Check balance (should be 0)
    let scriptResult = executeScript(
        "../scripts/check_usdc_balance.cdc",
        [alice.address]
    )
    Test.expect(scriptResult, Test.beSucceeded())
    Test.assertEqual(0.0, scriptResult.returnValue! as! UFix64)
}

// Note: The following tests would require minting USDC tokens


access(all) fun testContributionFlow() {
 // 1. Setup USDC vaults for all members
    // 2. Mint USDC to members
    // 3. Members make contributions
    // 4. Verify contributions are recorded
    // 5. Test automatic payout trigger when all members contribute

    // Setup circle
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [3 as UInt64, 100.0, 86400.0],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Members join
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        bob
    )
    Test.expect(txResult, Test.beSucceeded())

    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        charlie
    )
    Test.expect(txResult, Test.beSucceeded())

    // TODO: Add USDC minting and contribution tests when FiatToken is deployed
}

// ========================================
// Payout Tests
// ========================================

access(all) fun testPayoutFlow() {
    // 1. Create circle with members
    // 2. All members contribute
    // 3. Execute payout to first member
    // 4. Verify member received correct amount (contribution * number of members)
    // 5. Advance to next cycle
    // 6. Repeat until all members have received payouts

    // TODO: Implement full payout test with USDC integration
}

// ========================================
// Integration Tests
// ========================================

access(all) fun testFullCircleLifecycle() {
    // This test demonstrates a complete circle lifecycle
    // 1. Create circle
    // 2. Members join
    // 3. Cycle 1: All contribute, member 1 gets payout
    // 4. Cycle 2: All contribute, member 2 gets payout
    // 5. Cycle 3: All contribute, member 3 gets payout
    // 6. Circle completes

    // Setup
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Create circle with 3 members
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [3 as UInt64, 100.0, 86400.0],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Bob and Charlie join
    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        bob
    )
    Test.expect(txResult, Test.beSucceeded())

    txResult = executeTransaction(
        "../transactions/join_circle.cdc",
        [0 as UInt64],
        charlie
    )
    Test.expect(txResult, Test.beSucceeded())

    // Verify circle is ready
    let scriptResult = executeScript(
        "../scripts/get_circle_info.cdc",
        [0 as UInt64]
    )
    Test.expect(scriptResult, Test.beSucceeded())

    let circleInfo = scriptResult.returnValue! as! {String: AnyStruct}
    Test.assertEqual(3, circleInfo["memberCount"]! as! Int)
    Test.assertEqual(0 as UInt64, circleInfo["currentCycle"]! as! UInt64)
    Test.assertEqual(0 as UInt64, circleInfo["currentPayoutPosition"]! as! UInt64)

    // TODO: Add contribution and payout tests with USDC
}

access(all) fun testGetUserCircles() {
    // Setup and create multiple circles
    var txResult = executeTransaction(
        "../transactions/setup_circle_manager.cdc",
        [],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Create first circle
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [3 as UInt64, 50.0, 86400.0],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Create second circle
    txResult = executeTransaction(
        "../transactions/create_circle.cdc",
        [4 as UInt64, 100.0, 604800.0],
        alice
    )
    Test.expect(txResult, Test.beSucceeded())

    // Get Alice's circles
    let scriptResult = executeScript(
        "../scripts/get_user_circles.cdc",
        [alice.address]
    )
    Test.expect(scriptResult, Test.beSucceeded())

    let circleIds = scriptResult.returnValue! as! [UInt64]
    Test.assertEqual(2, circleIds.length)
    Test.assertEqual(0 as UInt64, circleIds[0])
    Test.assertEqual(1 as UInt64, circleIds[1])
}
