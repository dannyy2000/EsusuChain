# Forte Workflow Integration for EsusuChain

## Overview

EsusuChain leverages Forte's scheduled transaction capabilities on Flow blockchain to automate contributions and payouts in savings circles. This eliminates the need for off-chain cron jobs or manual triggering.

## Architecture

### 1. Automated Contributions

Forte Workflow schedules time-based triggers for each member's contribution based on the circle's cycle duration.

#### How It Works:

```
Circle Created (cycleDuration = 7 days)
    ↓
Forte Workflow creates scheduled transactions for each member:
    - Member 1: deposit() every 7 days starting at T+0
    - Member 2: deposit() every 7 days starting at T+0
    - Member 3: deposit() every 7 days starting at T+0
    - Member N: deposit() every 7 days starting at T+0
    ↓
Scheduled transactions execute automatically
    ↓
When all members contribute → cycle advances automatically
```

#### Implementation Steps:

1. **Register Circle with Forte Workflow** (When circle is created and full):
   ```cadence
   // After circle creation and all members join
   ForteWorkflow.scheduleRecurringTransaction(
       transaction: "make_contribution.cdc",
       arguments: [circleId, contributionAmount],
       schedule: {
           startTime: circle.lastCycleTimestamp,
           interval: circle.cycleDuration,
           endCondition: circle.status == CircleStatus.Completed
       },
       signers: circle.memberOrder  // All members
   )
   ```

2. **Member Contribution Transaction** (Executed by Forte):
   ```cadence
   // cadence/transactions/make_contribution.cdc
   // This transaction is automatically executed by Forte Workflow
   // for each member based on the schedule
   transaction(circleId: UInt64, amount: UFix64) {
       prepare(signer: auth(Storage) &Account) {
           // Withdraw from member's USDC vault
           let vault <- signer.storage.borrow<&FiatToken.Vault>()
               .withdraw(amount: amount)

           // Make contribution to circle
           EsusuChain.makeContribution(
               circleId: circleId,
               memberAddress: signer.address,
               payment: <- vault
           )
       }
   }
   ```

### 2. Automated Payouts

When all members have contributed for a cycle, the contract automatically triggers the payout to the next member in rotation.

#### How It Works:

```
All Members Contribute in Cycle N
    ↓
Contract checks: allMembersPaidCurrentCycle() == true
    ↓
Contract advances cycle: currentCycle++
    ↓
Forte Workflow triggers: execute_payout.cdc
    ↓
Payout executed to member at currentPayoutPosition
    ↓
currentPayoutPosition++
    ↓
If currentPayoutPosition >= numberOfMembers:
    Circle Status = Completed
```

#### Implementation Steps:

1. **Payout Trigger** (Automatically called after all contributions):
   ```cadence
   // After last member contributes in a cycle
   // Forte Workflow monitors circle events and triggers payout

   ForteWorkflow.scheduleTransaction(
       transaction: "execute_payout.cdc",
       arguments: [circleId, recipientAddress],
       condition: circle.allMembersPaidCurrentCycle(),
       executionTime: "immediate"
   )
   ```

2. **Payout Transaction** (Executed by Forte):
   ```cadence
   // cadence/transactions/execute_payout.cdc
   transaction(circleId: UInt64, recipientAddress: Address) {
       prepare(signer: auth(Storage) &Account) {
           // Execute payout from circle
           let payout <- EsusuChain.executePayout(circleId: circleId)

           // Get recipient's USDC receiver
           let receiver = getAccount(recipientAddress)
               .getCapability<&{FungibleToken.Receiver}>(
                   FiatToken.ReceiverPublicPath
               )
               .borrow()!

           // Deposit to recipient
           receiver.deposit(from: <- payout)
       }
   }
   ```

## Event-Driven Automation

EsusuChain emits events that Forte Workflow can listen to for triggering actions:

### Key Events:

1. **CircleCreated**: Triggers setup of contribution schedule
   ```cadence
   event CircleCreated(
       circleId: UInt64,
       creator: Address,
       numberOfMembers: UInt64,
       contributionAmount: UFix64,
       cycleDuration: UFix64
   )
   ```

2. **MemberJoined**: Updates contribution schedule when new member joins
   ```cadence
   event MemberJoined(
       circleId: UInt64,
       member: Address,
       position: UInt64
   )
   ```

3. **ContributionMade**: Tracks contributions and triggers cycle advancement
   ```cadence
   event ContributionMade(
       circleId: UInt64,
       member: Address,
       amount: UFix64,
       cycle: UInt64
   )
   ```

4. **CycleAdvanced**: Triggers payout execution
   ```cadence
   event CycleAdvanced(
       circleId: UInt64,
       newCycle: UInt64
   )
   ```

5. **PayoutExecuted**: Confirms successful payout
   ```cadence
   event PayoutExecuted(
       circleId: UInt64,
       recipient: Address,
       amount: UFix64,
       cycle: UInt64
   )
   ```

## Forte Workflow Configuration

### 1. Setup Forte Account

```javascript
// forte-config.js
import { ForteClient } from '@forte/workflow-sdk'

const forteClient = new ForteClient({
    network: 'testnet', // or 'mainnet'
    apiKey: process.env.FORTE_API_KEY,
    flowAccessNode: 'access.devnet.nodes.onflow.org:9000'
})
```

### 2. Register Circle Workflow

```javascript
// When a circle is created and full
async function registerCircleWorkflow(circleId, circleInfo) {
    const { numberOfMembers, contributionAmount, cycleDuration, memberOrder } = circleInfo

    // Schedule recurring contributions for each member
    for (const member of memberOrder) {
        await forteClient.scheduleRecurring({
            name: `circle-${circleId}-contribution-${member}`,
            transaction: 'make_contribution.cdc',
            arguments: [circleId, contributionAmount],
            signer: member,
            schedule: {
                type: 'interval',
                startTime: Date.now(),
                interval: cycleDuration * 1000, // Convert to milliseconds
                maxExecutions: numberOfMembers // Stop after all cycles complete
            },
            gas: {
                limit: 9999,
                payer: member // Member pays their own gas
            }
        })
    }

    console.log(`Workflow registered for circle ${circleId}`)
}
```

### 3. Register Payout Workflow

```javascript
// Monitor for cycle advancement and trigger payouts
async function setupPayoutWorkflow(circleId) {
    await forteClient.watchEvent({
        contractAddress: ESUSU_CHAIN_ADDRESS,
        contractName: 'EsusuChain',
        eventName: 'CycleAdvanced',
        filter: { circleId },
        handler: async (event) => {
            const { circleId, newCycle } = event.data

            // Get circle info to determine recipient
            const circleInfo = await getCircleInfo(circleId)
            const recipientAddress = circleInfo.memberOrder[circleInfo.currentPayoutPosition]

            // Trigger payout transaction
            await forteClient.executeTransaction({
                name: `circle-${circleId}-payout-cycle-${newCycle}`,
                transaction: 'execute_payout.cdc',
                arguments: [circleId, recipientAddress],
                signer: process.env.ADMIN_ADDRESS, // Or use a service account
                gas: {
                    limit: 9999,
                    payer: process.env.ADMIN_ADDRESS
                }
            })

            console.log(`Payout executed for circle ${circleId}, cycle ${newCycle}`)
        }
    })
}
```

## Testing Forte Integration

### Local Testing with Emulator

1. Start Flow emulator:
   ```bash
   flow emulator start
   ```

2. Deploy contracts:
   ```bash
   flow project deploy --network emulator
   ```

3. Run Forte Workflow simulator:
   ```bash
   npm run forte:simulate
   ```

### Testnet Testing

1. Deploy to testnet:
   ```bash
   flow project deploy --network testnet
   ```

2. Configure Forte testnet credentials:
   ```bash
   export FORTE_API_KEY=your_testnet_key
   export FORTE_NETWORK=testnet
   ```

3. Register workflows:
   ```bash
   npm run forte:register
   ```

4. Monitor workflow execution:
   ```bash
   npm run forte:monitor
   ```

## Best Practices

1. **Gas Management**: Ensure members have sufficient FLOW for gas fees
2. **Error Handling**: Implement retry logic for failed transactions
3. **Monitoring**: Set up alerts for missed contributions or failed payouts
4. **Security**: Use Forte's secure key management for transaction signing
5. **Testing**: Thoroughly test on emulator and testnet before mainnet deployment

## Circle Lifecycle with Forte

```
1. User creates circle
   ↓
2. Members join circle
   ↓
3. When circle is full:
   → Forte registers contribution schedules for all members
   ↓
4. Cycle 1 begins:
   → Forte triggers contribution transactions for all members
   → After all contribute: CycleAdvanced event emitted
   → Forte triggers payout to member[0]
   ↓
5. Cycle 2 begins:
   → Forte triggers contribution transactions for all members
   → After all contribute: CycleAdvanced event emitted
   → Forte triggers payout to member[1]
   ↓
6. Repeat until all members receive payout
   ↓
7. Circle status = Completed
   → Forte stops scheduled transactions
```

## Troubleshooting

### Common Issues:

1. **Missed Contributions**:
   - Check member's USDC balance
   - Verify FLOW balance for gas
   - Review Forte execution logs

2. **Failed Payouts**:
   - Ensure recipient has USDC vault set up
   - Check circle vault has sufficient balance
   - Verify all members contributed

3. **Schedule Drift**:
   - Monitor block timestamps
   - Adjust cycle duration if needed
   - Use Forte's time-sync features

## Next Steps

1. Set up Forte Workflow account
2. Deploy EsusuChain contract to testnet
3. Register test circle with Forte
4. Monitor automated contributions and payouts
5. Optimize gas costs and timing
6. Deploy to mainnet

## Resources

- [Forte Workflow Documentation](https://docs.forte.io/workflow)
- [Flow Scheduled Transactions](https://developers.flow.com/build/advanced-concepts/scheduled-transactions)
- [EsusuChain Smart Contract](./cadence/contracts/EsusuChain.cdc)
- [Example Workflows](./forte/examples/)
