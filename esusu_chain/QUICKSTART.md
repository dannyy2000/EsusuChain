# EsusuChain Quick Start Guide

## What You Just Built

A complete decentralized rotating savings platform (ROSCA/Esusu) on Flow blockchain with:

- **Smart Contracts**: Circle creation, member management, automated contributions & payouts
- **USDC Integration**: Using Flow's FiatToken for stable value transfers
- **Forte Workflow**: Automated scheduling for contributions and payouts
- **Comprehensive Tests**: Full test coverage for all features

## File Overview

### Core Contract
- `cadence/contracts/EsusuChain.cdc` - Main smart contract with all circle logic

### Transactions (State-Changing Operations)
- `setup_circle_manager.cdc` - Initialize user's circle manager
- `setup_usdc_vault.cdc` - Setup USDC vault for user
- `create_circle.cdc` - Create a new savings circle
- `join_circle.cdc` - Join an existing circle
- `make_contribution.cdc` - Contribute to a circle (automated by Forte)
- `execute_payout.cdc` - Execute payout to member (automated by Forte)

### Scripts (Read-Only Operations)
- `get_circle_info.cdc` - Get circle details
- `get_member_info.cdc` - Get member information
- `get_user_circles.cdc` - Get all circles for a user
- `check_usdc_balance.cdc` - Check USDC balance

### Tests
- `cadence/tests/EsusuChain_test.cdc` - Comprehensive unit tests

## Quick Test Run

1. **Start the Flow Emulator**:
   ```bash
   flow emulator start
   ```

2. **Deploy Contracts** (in new terminal):
   ```bash
   flow project deploy --network emulator
   ```

3. **Run Tests**:
   ```bash
   flow test cadence/tests/EsusuChain_test.cdc
   ```

## Example Usage Flow

### 1. Setup (One-time per user)
```bash
# Setup circle manager
flow transactions send cadence/transactions/setup_circle_manager.cdc

# Setup USDC vault
flow transactions send cadence/transactions/setup_usdc_vault.cdc
```

### 2. Create a Circle
```bash
# Create circle: 4 members, 100 USDC per cycle, 7 days per cycle
flow transactions send cadence/transactions/create_circle.cdc \
  --args-json '[
    {"type": "UInt64", "value": "4"},
    {"type": "UFix64", "value": "100.0"},
    {"type": "UFix64", "value": "604800.0"}
  ]'
```

### 3. Members Join
```bash
# Other members join the circle
flow transactions send cadence/transactions/join_circle.cdc \
  --args-json '[{"type": "UInt64", "value": "0"}]' \
  --signer member2

flow transactions send cadence/transactions/join_circle.cdc \
  --args-json '[{"type": "UInt64", "value": "0"}]' \
  --signer member3

flow transactions send cadence/transactions/join_circle.cdc \
  --args-json '[{"type": "UInt64", "value": "0"}]' \
  --signer member4
```

### 4. Query Circle Info
```bash
flow scripts execute cadence/scripts/get_circle_info.cdc \
  --args-json '[{"type": "UInt64", "value": "0"}]'
```

## How Automation Works (Forte Workflow)

Once a circle is full, Forte Workflow automatically:

1. **Schedules Contributions**: Sets up recurring transactions for each member
2. **Monitors Cycle Completion**: Watches for all members contributing
3. **Triggers Payouts**: Automatically executes payout when cycle completes
4. **Advances Cycles**: Manages cycle progression until circle completes

See `FORTE_WORKFLOW_INTEGRATION.md` for detailed automation setup.

## Key Concepts

### Circle Lifecycle
```
1. Create Circle (define members, amount, duration)
   ↓
2. Members Join (until circle is full)
   ↓
3. Cycle 1: All contribute → Member 1 receives payout
   ↓
4. Cycle 2: All contribute → Member 2 receives payout
   ↓
5. Cycle N: All contribute → Member N receives payout
   ↓
6. Circle Completes
```

### Example Circle
- **Members**: 4 people
- **Contribution**: 100 USDC per cycle
- **Cycle Duration**: 7 days
- **Total Pool**: 400 USDC per cycle

**Payout Schedule**:
- Week 1: Everyone contributes 100 USDC → Alice gets 400 USDC
- Week 2: Everyone contributes 100 USDC → Bob gets 400 USDC
- Week 3: Everyone contributes 100 USDC → Charlie gets 400 USDC
- Week 4: Everyone contributes 100 USDC → Diana gets 400 USDC
- **Total**: Each person contributed 400 USDC and received 400 USDC

## Testing the Contract

The test file includes tests for:

- Circle creation with valid/invalid parameters
- Member joining (including edge cases)
- Full circle lifecycle simulation
- Multiple circles per user
- Member information retrieval

Run specific test:
```bash
flow test --cover --covercode="contracts" cadence/tests/EsusuChain_test.cdc
```

## Contract Features Implemented

### 1. Circle Creation
- [x] Create circle with customizable parameters
- [x] Automatic creator membership
- [x] Parameter validation
- [x] Unique circle IDs

### 2. Member Management
- [x] Join existing circles
- [x] Prevent duplicate members
- [x] Enforce member limits
- [x] Track member positions

### 3. Contributions
- [x] USDC deposits to circle vault
- [x] Amount validation
- [x] Cycle tracking
- [x] Automatic cycle advancement

### 4. Payouts
- [x] Automated payout execution
- [x] Rotation-based distribution
- [x] Circle completion detection
- [x] Safe fund transfers

### 5. Events
- [x] CircleCreated
- [x] MemberJoined
- [x] ContributionMade
- [x] PayoutExecuted
- [x] CycleAdvanced
- [x] CircleCompleted

## Next Steps

1. **Local Testing**:
   - Run all tests on emulator
   - Test different circle configurations
   - Verify event emissions

2. **Testnet Deployment**:
   - Update `flow.json` with your testnet address
   - Deploy to testnet
   - Create test circles with real users

3. **Forte Integration**:
   - Set up Forte Workflow account
   - Configure automation workflows
   - Test automated contributions

4. **Production Considerations**:
   - Security audit
   - Gas optimization
   - User interface development
   - Monitoring and alerts

## Important Notes

### USDC Integration
The contract uses Flow's FiatToken (USDC) standard. Key addresses:
- **Testnet**: `0xa983fecbed621163`
- **Mainnet**: `0xb19436aae4d94622`

Update the import addresses in:
- Contract: `EsusuChain.cdc`
- Transactions: All transaction files
- Scripts: Balance checking script

### Before Running on Testnet

1. Replace placeholder addresses in `flow.json`:
   - Set your testnet account address
   - Verify FungibleToken and FiatToken addresses

2. Ensure USDC availability:
   - Get testnet USDC from faucet
   - Or use testnet bridge

3. Configure Forte Workflow:
   - Register for Forte account
   - Set up API credentials
   - Configure workflow triggers

## Troubleshooting

### Common Issues

**Contract deployment fails**:
- Ensure emulator is running
- Check contract import addresses
- Verify account has FLOW for gas

**Transaction fails**:
- Check account setup (CircleManager, USDC vault)
- Verify USDC balance for contributions
- Ensure circle exists and is active

**Tests fail**:
- Deploy contracts to test network first
- Check test account configuration
- Review error messages for specifics

### Getting Help

- Check Flow documentation: https://developers.flow.com/
- Cadence language docs: https://cadence-lang.org/
- Flow Discord: https://discord.gg/flow

## Resources

- **Main README**: `ESUSU_README.md` - Full project documentation
- **Forte Integration**: `FORTE_WORKFLOW_INTEGRATION.md` - Automation setup
- **Flow Docs**: `README.md` - Flow project basics
- **Contract**: `cadence/contracts/EsusuChain.cdc` - Smart contract code

---

Happy building! 🚀
