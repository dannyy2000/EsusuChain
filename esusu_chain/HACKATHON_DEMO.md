# EsusuChain Hackathon Demo Guide

## Quick Demo Setup (15 minutes)

This guide gets your EsusuChain demo running on Flow testnet with **automated scheduler** for the hackathon.

## Prerequisites

✅ Flow CLI installed
✅ Testnet account created
✅ ~100 FLOW tokens in testnet account (get from [testnet faucet](https://testnet-faucet.onflow.org/))

## Step-by-Step Demo

### 1. Deploy Contracts (2 mins)

```bash
# Navigate to project
cd esusu_chain

# Deploy to testnet
flow project deploy --network testnet

# Expected output:
# ✅ EsusuChain deployed to: 0x...
# ✅ EsusuChainTransactionHandler deployed to: 0x...
```

Save your contract address - you'll need it!

### 2. Setup Your Account (1 min)

```bash
# Setup circle manager
flow transactions send cadence/transactions/setup_circle_manager.cdc \
  --network testnet \
  --signer your-account

# Setup scheduler manager (one-time)
flow transactions send cadence/transactions/setup_scheduler_manager.cdc \
  --network testnet \
  --signer your-account
```

### 3. Create Demo Circle (1 min)

**For hackathon demo, use SHORT cycle duration (60 seconds = 1 minute)**

```bash
# Create 3-member circle with 1-minute cycles
flow transactions send cadence/transactions/create_circle.cdc \
  3 5.0 60.0 \
  --network testnet \
  --signer your-account
```

Parameters:
- `3` = 3 members
- `5.0` = 5 FLOW contribution per member
- `60.0` = 60 seconds (1 minute) cycle duration

### 4. Join Circle as All 3 Members (3 mins)

**Option A: Use same account 3 times (easiest for demo)**

```bash
# Join as member 1
flow transactions send cadence/transactions/join_circle_with_approval.cdc 0 \
  --network testnet --signer your-account

# Join as member 2
flow transactions send cadence/transactions/join_circle_with_approval.cdc 0 \
  --network testnet --signer your-account

# Join as member 3 (circle starts!)
flow transactions send cadence/transactions/join_circle_with_approval.cdc 0 \
  --network testnet --signer your-account
```

**Option B: Use 3 different testnet accounts (more realistic)**

Create 3 accounts, fund each with FLOW, then each joins.

### 5. Schedule Automated Pulls (1 min)

**THIS IS THE MAGIC - Set it and forget it!**

```bash
flow transactions send cadence/transactions/schedule_circle_pulls.cdc \
  0 1 1000 \
  --network testnet \
  --signer your-account
```

Parameters:
- `0` = circleId (the circle we just created)
- `1` = Medium priority
- `1000` = Gas limit

Expected output:
```
✅ Transaction executed successfully

Logs:
  "Scheduled contribution pulls for circle 0"
  "First pull scheduled at: [timestamp]"
  "Cycle duration: 60.0 seconds"
```

### 6. Watch the Automation! (3 minutes)

**Now sit back and watch the blockchain work!**

```bash
# Check circle status
flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network testnet

# In another terminal, watch events in real-time
flow events get A.YOUR_ADDRESS.EsusuChain.ContributionPulled \
  --network testnet \
  --start latest
```

**Timeline:**
```
Minute 0: Circle created & scheduler configured
Minute 1: 🤖 First automated pull → Member 0 gets payout
Minute 2: 🤖 Second automated pull → Member 1 gets payout
Minute 3: 🤖 Third automated pull → Member 2 gets payout → Circle complete! ✅
```

## Demo Script for Presentation

### Opening (30 seconds)

> "Today I'm demoing EsusuChain - an automated ROSCA (Rotating Savings and Credit Association) on Flow blockchain.
>
> The key innovation? **Fully automated contributions and payouts using Flow Transaction Scheduler**. No external servers, no cron jobs, no manual triggers. The blockchain itself executes everything!"

### Show Circle Creation (1 minute)

```bash
# Show creating circle
flow transactions send cadence/transactions/create_circle.cdc \
  3 5.0 60.0 --network testnet --signer demo-account

# Explain:
# - 3 members will rotate
# - Each contributes 5 FLOW per cycle
# - Automated pull every 60 seconds
```

> "I've created a 3-member circle. Each member will contribute 5 FLOW per cycle, and payouts happen automatically every 60 seconds."

### Show Members Joining (1 minute)

```bash
# Show joining
flow transactions send cadence/transactions/join_circle_with_approval.cdc 0 \
  --network testnet --signer demo-account
```

> "When members join, they provide a **provider capability** - this allows the smart contract to automatically pull funds from their wallet.
>
> The member approves 15 FLOW total (5 FLOW × 3 cycles) upfront. This ensures they have funds for all cycles."

### Show Scheduler Setup (30 seconds)

```bash
# Show scheduling
flow transactions send cadence/transactions/schedule_circle_pulls.cdc \
  0 1 1000 --network testnet --signer demo-account
```

> "Now here's the magic - I'm registering this circle with Flow Transaction Scheduler.
>
> This creates a **TransactionHandler** that the blockchain will automatically execute every 60 seconds. No external trigger needed!"

### Show Automation in Action (2 minutes)

```bash
# Show real-time events
flow events get A.YOUR_ADDRESS.EsusuChain.ContributionPulled \
  --network testnet --start latest
```

> "Watch this... [wait 60 seconds]
>
> There! The blockchain just automatically:
> 1. Pulled 5 FLOW from each member
> 2. Paid out 15 FLOW to the first member
> 3. Scheduled the next pull
>
> All automatically. No human intervention.
>
> [wait another 60 seconds]
>
> And there's the second cycle! Member 2 just got their payout. The system will continue until all members receive their turn."

### Show Circle Completion (1 minute)

```bash
# Check final status
flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network testnet
```

> "After 3 minutes, the circle is complete! Every member contributed 15 FLOW total and received 15 FLOW back - but they got their payout as a lump sum when it was their turn.
>
> This is the power of ROSCAs - it's not a loan, not an investment, but a communal savings mechanism. Combined with Flow Transaction Scheduler, it's **completely trustless and automated**."

### Closing (30 seconds)

> "What makes this special:
> - ✅ Fully decentralized (no external infrastructure)
> - ✅ Trustless automation (blockchain guarantees execution)
> - ✅ Production ready (using Flow's native scheduler)
> - ✅ Works on testnet and mainnet
>
> This could serve millions in underbanked communities who rely on traditional ROSCAs - but now with blockchain's trust guarantees and automation!"

## Hackathon Judging Points

### Technical Achievement
- **Flow Transaction Scheduler Integration** - Using Flow's native scheduling (not external cron)
- **Provider Capabilities** - Automated fund pulls with user consent
- **TransactionHandler Pattern** - Proper implementation of scheduler interface
- **Resource-Oriented Design** - Leveraging Cadence's unique features

### Real-World Impact
- **Financial Inclusion** - Serving underbanked communities
- **Cultural Relevance** - ROSCAs exist in many cultures (Esusu in Nigeria, Tanda in Mexico, Hui in China)
- **Trust Replacement** - Blockchain replaces social trust in traditional ROSCAs
- **Scalability** - Can serve unlimited concurrent circles

### Innovation
- **First ROSCA with Native Scheduling** - Using Flow Transaction Scheduler for DeFi
- **Set and Forget** - No infrastructure needed after deployment
- **Upfront Approval Pattern** - Ensures participants have funds for all cycles
- **Production Ready** - Works on testnet/mainnet, not just local

## Demo Variations

### Fast Demo (5 minutes total)
- Use 30-second cycles
- Show 2-member circle (2 cycles = 1 minute total)
- Perfect for quick presentations

### Standard Demo (10 minutes)
- Use 60-second cycles (as shown above)
- Show 3-member circle (3 cycles = 3 minutes)
- Good balance of speed and realism

### Realistic Demo (30+ minutes)
- Use 5-minute cycles
- Show 4-member circle
- Demonstrates production-like behavior

## Troubleshooting During Demo

### "Circle not starting"
Check all members joined:
```bash
flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network testnet
# Look for memberCount == numberOfMembers
```

### "Scheduler not executing"
Check circle is Active:
```bash
flow scripts execute cadence/scripts/get_circle_info.cdc 0 --network testnet
# status should be "Active"
```

### "Transaction failed"
Check you have enough FLOW:
```bash
flow accounts get your-account --network testnet
# Need ~50 FLOW for safe demo
```

## Presentation Tips

### Before Demo Day

1. **Pre-deploy contracts** to testnet (don't do during presentation)
2. **Test full flow** at least once
3. **Save all commands** in a script
4. **Have backup account** with FLOW in case of issues
5. **Record video** of working demo as backup

### During Presentation

1. **Start with problem** - explain what ROSCAs are
2. **Show automation** - emphasize no external infrastructure
3. **Highlight innovation** - using Flow Transaction Scheduler for DeFi
4. **Demo in real-time** - show actual blockchain execution
5. **Have fallback** - video recording if live demo fails

### After Demo

1. **Share contract address** on testnet for judges to explore
2. **Provide Flowscan links** to show transaction history
3. **Explain code** if judges have questions
4. **Discuss future plans** - mainnet launch, UI, mobile app

## Resources for Judges

- **Live Contract**: `https://testnet.flowscan.org/contract/A.YOUR_ADDRESS.EsusuChain`
- **GitHub**: Link to your repository
- **Documentation**: `SCHEDULER_INTEGRATION.md` and `ESUSU_README.md`
- **Flowscan Explorer**: Show transaction history

## Key Talking Points

### Why Flow?
- **Native Scheduler** - No other blockchain has this built-in
- **Cadence Language** - Resource-oriented programming perfect for DeFi
- **Capabilities** - Secure, flexible access control
- **User Experience** - Fast, cheap transactions

### Why This Matters?
- **2 billion people** worldwide participate in informal savings groups
- **$1+ trillion** flows through ROSCAs annually
- **Trust is the bottleneck** - blockchain removes this limitation
- **Automation** - scheduler makes it practical at scale

### What's Next?
- **Mainnet Launch** - Ready for production
- **Mobile App** - User-friendly interface
- **Multi-Currency** - Support for stablecoins (USDC, etc.)
- **Social Features** - Invite friends, create private circles
- **Analytics** - Track savings progress, circle history

## Success Metrics for Demo

✅ Contracts deploy successfully
✅ Circle created and members join
✅ Scheduler successfully configured
✅ First automated pull executes on time
✅ Events show up in explorer
✅ Circle completes all cycles
✅ Final balances reconcile correctly

## Common Questions & Answers

**Q: What if a member doesn't have funds?**
A: They can't join! The contract checks balance upfront (contributionAmount × numberOfMembers).

**Q: Can someone skip a contribution?**
A: No! The contract has a provider capability and automatically pulls funds.

**Q: What if the blockchain is down?**
A: Flow has 99.99% uptime. Scheduled transactions execute as soon as network is available.

**Q: How much does this cost?**
A: On testnet: free. On mainnet: ~$0.001 per transaction (very cheap!).

**Q: Is this tested?**
A: Yes! See `TEST_SUMMARY.md` for test coverage and `run_integration_tests.sh` for automated tests.

**Q: Can I use this in production?**
A: Yes! It's production-ready for testnet/mainnet deployment.

---

**Good luck with your hackathon demo!** 🚀

Remember: The scheduler automation is your **unique selling point** - emphasize this heavily! No other blockchain-based ROSCA solution has truly automated, trustless execution without external infrastructure.
