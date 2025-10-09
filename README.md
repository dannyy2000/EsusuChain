# EsusuChain - Decentralized Rotating Savings on Flow

EsusuChain is a blockchain-based implementation of traditional rotating savings and credit associations (ROSCA), also known as "Esusu" in many African communities. Built on the Flow blockchain with Cadence smart contracts, it provides a trustless, automated savings circle platform using USDC stablecoin.

## Features

### 1. Circle Creation
- Any user can create a new savings circle
- Define number of members, contribution amount, and cycle duration
- Creator automatically becomes the first member
- Immutable circle parameters stored on-chain

### 2. Automated Contributions
- Scheduled contributions using Forte Workflow
- Members automatically contribute on each cycle
- No manual intervention required
- Contributions tracked transparently on-chain

### 3. Automated Payouts
- Payouts triggered automatically when all members contribute
- Funds distributed in predetermined rotation order
- Each member receives total pool amount once
- Circle completes after all members receive payouts

### 4. USDC Integration
- Uses USDC (FiatToken) for stable value
- Built on Flow's FungibleToken standard
- Secure vault management for circle funds

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      EsusuChain Contract                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Circle    │  │    Circle    │  │    Circle    │     │
│  │  Resource    │  │  Resource    │  │  Resource    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                          │                                   │
│                    USDC Vaults                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Forte Workflow                            │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Contribution   │         │     Payout       │         │
│  │    Scheduler     │────────▶│    Executor      │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
esusu_chain/
├── cadence/
│   ├── contracts/
│   │   └── EsusuChain.cdc          # Main contract
│   ├── transactions/
│   │   ├── setup_circle_manager.cdc
│   │   ├── create_circle.cdc
│   │   ├── join_circle.cdc
│   │   ├── setup_usdc_vault.cdc
│   │   ├── make_contribution.cdc
│   │   └── execute_payout.cdc
│   ├── scripts/
│   │   ├── get_circle_info.cdc
│   │   ├── get_member_info.cdc
│   │   ├── get_user_circles.cdc
│   │   └── check_usdc_balance.cdc
│   └── tests/
│       └── EsusuChain_test.cdc
├── flow.json
├── README.md (Flow project docs)
├── ESUSU_README.md (This file)
└── FORTE_WORKFLOW_INTEGRATION.md
```

## Getting Started

### Prerequisites

- [Flow CLI](https://developers.flow.com/tools/flow-cli/install) installed
- Node.js and npm (for Forte Workflow integration)
- Flow wallet account with USDC

### Installation

1. Navigate to the project:
   ```bash
   cd esusu_chain
   ```

2. Start the Flow emulator:
   ```bash
   flow emulator start
   ```

3. Deploy contracts (in a new terminal):
   ```bash
   flow project deploy --network emulator
   ```

### Running Tests

Run the comprehensive test suite:

```bash
flow test cadence/tests/EsusuChain_test.cdc
```

## Usage

### 1. Setup Circle Manager

First, set up a CircleManager resource in your account:

```bash
flow transactions send cadence/transactions/setup_circle_manager.cdc \
  --network testnet \
  --signer your-account
```

### 2. Setup USDC Vault

Ensure you have a USDC vault configured:

```bash
flow transactions send cadence/transactions/setup_usdc_vault.cdc \
  --network testnet \
  --signer your-account
```

### 3. Create a Circle

Create a new savings circle:

```bash
flow transactions send cadence/transactions/create_circle.cdc \
  --args-json '[
    {"type": "UInt64", "value": "4"},
    {"type": "UFix64", "value": "100.0"},
    {"type": "UFix64", "value": "604800.0"}
  ]' \
  --network testnet \
  --signer your-account
```

Parameters:
- Number of members: 4
- Contribution amount: 100.0 USDC
- Cycle duration: 604800 seconds (7 days)

### 4. Join a Circle

Join an existing circle:

```bash
flow transactions send cadence/transactions/join_circle.cdc \
  --args-json '[
    {"type": "UInt64", "value": "0"}
  ]' \
  --network testnet \
  --signer member-account
```

### 5. Query Circle Information

Get details about a circle:

```bash
flow scripts execute cadence/scripts/get_circle_info.cdc \
  --args-json '[
    {"type": "UInt64", "value": "0"}
  ]' \
  --network testnet
```

### 6. Make a Contribution

Contribute to a circle:

```bash
flow transactions send cadence/transactions/make_contribution.cdc \
  --args-json '[
    {"type": "UInt64", "value": "0"},
    {"type": "UFix64", "value": "100.0"}
  ]' \
  --network testnet \
  --signer member-account
```

## Smart Contract Overview

### Main Components

#### Circle Resource
Represents a savings circle with:
- `circleId`: Unique identifier
- `numberOfMembers`: Total members in circle
- `contributionAmount`: Amount each member contributes
- `cycleDuration`: Time between cycles
- `currentCycle`: Current cycle number
- `currentPayoutPosition`: Next member to receive payout
- `members`: Member information mapping
- `vault`: USDC vault holding contributions

#### CircleManager Resource
Manages multiple circles for a user:
- Creates new circles
- Tracks circle IDs
- Provides public interface for queries

### Key Functions

#### `createCircle()`
Creates a new savings circle with specified parameters.

#### `addMember()`
Adds a member to an existing circle.

#### `deposit()`
Processes a member's contribution for the current cycle.

#### `payoutNextMember()`
Executes payout to the next member in rotation.

#### `advanceCycle()`
Advances to the next cycle after all contributions received.

## Events

The contract emits the following events:

- `CircleCreated`: New circle created
- `MemberJoined`: Member joined a circle
- `ContributionMade`: Member made a contribution
- `PayoutExecuted`: Payout sent to member
- `CycleAdvanced`: Circle advanced to next cycle
- `CircleCompleted`: All payouts completed

## Forte Workflow Integration

EsusuChain uses Forte Workflow for automated contributions and payouts. See [FORTE_WORKFLOW_INTEGRATION.md](./FORTE_WORKFLOW_INTEGRATION.md) for detailed setup instructions.

### Key Benefits:
- Automatic contribution scheduling
- No manual transaction triggering
- Gas-efficient execution
- Reliable timing
- Event-driven automation

## Security Considerations

1. **Member Verification**: Only registered members can contribute
2. **Amount Validation**: Contributions must match exact circle amount
3. **Cycle Management**: Payouts only execute when all members contribute
4. **Status Checks**: Circle must be active for operations
5. **Vault Security**: Circle funds stored in isolated USDC vault

## Testing Strategy

The project includes comprehensive tests covering:

1. **Circle Creation Tests**
   - Valid circle creation
   - Invalid parameter handling
   - Multiple circles per user

2. **Membership Tests**
   - Joining circles
   - Full circle prevention
   - Duplicate member prevention

3. **Contribution Tests**
   - Valid contributions
   - Amount validation
   - Cycle advancement

4. **Payout Tests**
   - Correct recipient selection
   - Amount calculation
   - Circle completion

5. **Integration Tests**
   - Full circle lifecycle
   - Multi-cycle operation
   - Error handling

## Deployment

### Testnet Deployment

1. Update `flow.json` with your testnet account address
2. Deploy to testnet:
   ```bash
   flow project deploy --network testnet
   ```

### Mainnet Deployment

1. Thoroughly test on testnet
2. Audit smart contracts
3. Update `flow.json` mainnet configuration
4. Deploy:
   ```bash
   flow project deploy --network mainnet
   ```

## Roadmap

- [ ] Implement penalty mechanism for missed contributions
- [ ] Add emergency withdrawal functionality
- [ ] Support multiple token types (not just USDC)
- [ ] Build web interface for circle management
- [ ] Implement reputation system for members
- [ ] Add circle discovery and recommendation features
- [ ] Support variable contribution amounts
- [ ] Implement lending features on top of savings

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.


---


## Resources

- [Flow Documentation](https://developers.flow.com/)
- [Cadence Language Reference](https://developers.flow.com/cadence/language)
- [USDC on Flow](https://developers.flow.com/evm/guides/usdc)
- [Forte Workflow](https://docs.forte.io/)

Built with ❤️ for the Web3 community
