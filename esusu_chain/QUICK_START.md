# EsusuChain - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Flow wallet (Lilico, Blocto, or any Flow-compatible wallet)
- Some testnet FLOW tokens (get from [testnet faucet](https://testnet-faucet.onflow.org/))

---

## Step 1: Start the Frontend

```bash
cd frontend
npm install  # If not already installed
npm run dev
```

The app will be running at `http://localhost:5173`

---

## Step 2: Connect Your Wallet

1. Open `http://localhost:5173` in your browser
2. Click **"Launch App"**
3. Click **"Connect Wallet"**
4. Choose your wallet provider (Lilico, Blocto, etc.)
5. Approve the connection request

---

## Step 3: Setup Your Account (One-Time)

1. On the Dashboard, you'll see "No circles found"
2. Click **"Setup Account"** button
3. Approve the transaction in your wallet
4. Wait for confirmation (~2-3 seconds)

This creates your CircleManager resource in your account storage.

---

## Step 4: Create Your First Circle

1. Click **"Create Circle"** button
2. Fill in the details:
   - **Circle Name**: "My First Circle" (UI only)
   - **Number of Members**: 3
   - **Contribution Amount**: 10 FLOW
   - **Cycle Duration**: Weekly
3. Click **"Continue"** through the steps
4. Review your circle details
5. Click **"Create Circle"**
6. Approve the transaction in your wallet
7. Wait for confirmation

---

## Step 5: Join an Existing Circle

1. On the Dashboard, click on any circle to view details
2. If you're not a member, you'll see a **"Join Circle"** button
3. Click the button
4. Approve the vault capability transaction
5. Wait for confirmation

**Important**: Joining a circle gives the contract permission to pull your contribution each cycle. Make sure you have sufficient FLOW balance.

---

## Common Operations

### View Circle Details
- Click on any circle card in the Dashboard
- See members, progress, and your position
- View contract details and links to FlowScan

### Check Your Wallet Balance
Your connected wallet address and balance are shown in the top-right corner of the Dashboard.

### Disconnect Wallet
Click the **"Disconnect"** button in the top-right corner.

---

## Testnet Contract Addresses

All contracts are deployed on **Flow Testnet**:

- **EsusuChain**: `0xa89655a0f8e3d113`
- **FlowToken**: `0x7e60df042a9c0868`
- **FungibleToken**: `0x9a0766d93b6608b7`

---

## Troubleshooting

### "CircleManager not found" Error
**Solution**: Click "Setup Account" on the Dashboard first.

### Transaction Fails
**Solution**:
- Check you have enough testnet FLOW
- Make sure you approved the transaction
- Try refreshing the page and retrying

### Can't See My Circle After Creating
**Solution**: Refresh the page. The circle data will update.

### Join Circle Button Doesn't Appear
**Possible Reasons**:
- You're already a member
- The circle is full (all positions taken)
- You're not connected to your wallet

---

## Get Testnet FLOW

Visit the Flow Testnet Faucet:
https://testnet-faucet.onflow.org/

1. Connect your wallet
2. Request testnet FLOW
3. Wait for tokens to arrive (~30 seconds)

---

## Wallet Setup

### Recommended Wallets

#### Lilico (Chrome Extension)
1. Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/lilico/hpclkefagolihohboafpheddmmgdffjm)
2. Create or import wallet
3. Switch to **Testnet** in settings
4. Fund with testnet FLOW

#### Blocto (Mobile & Web)
1. Visit [blocto.app](https://blocto.app)
2. Create account
3. Switch to **Testnet**
4. Fund with testnet FLOW

---

## What Happens When You Create a Circle?

1. Your CircleManager creates a new Circle resource
2. You become the creator and first member (position #1)
3. A unique Circle ID is generated (0, 1, 2, etc.)
4. Other users can now join your circle

---

## What Happens When You Join a Circle?

1. You approve a vault capability for your FlowToken vault
2. The contract stores this capability
3. You're added to the circle's member list
4. You receive a position number in the payout queue
5. **Automation**: The Flow Transaction Scheduler will automatically:
   - Pull your contribution each cycle
   - Distribute payouts when it's your turn

---

## Automated Operations

Once a circle is scheduled (requires admin action), the following happens automatically:

- **Every Cycle**: Contributions are pulled from all members
- **Payout Distribution**: The next person in queue receives the pool
- **No Manual Intervention**: Everything runs 24/7 via Flow scheduler

---

## Demo Scenario

### Quick Demo for Hackathon Judges

1. **Connect Wallet** (30 seconds)
2. **Setup Account** (1 transaction, ~3 seconds)
3. **Create Circle**:
   - 3 members
   - 10 FLOW contribution
   - 7-day cycle
   - (1 transaction, ~3 seconds)
4. **Show Circle Details**: View the newly created circle
5. **Join Another Circle**: If there's an existing circle
6. **Explain Automation**: How the scheduler handles everything

**Total Time**: ~5 minutes

---

## Development Mode

### Hot Reload
The frontend supports hot reload. Make changes to any file and see them instantly.

### View Console Logs
Open browser DevTools (F12) to see:
- FCL authentication events
- Transaction IDs
- Data fetching logs
- Error details

### Test Transactions
Use the browser console to test FCL calls:
```javascript
// Check current user
fcl.currentUser.snapshot()

// Check configuration
fcl.config()
```

---

## Production Checklist

Before deploying to mainnet:

- [ ] Update contract addresses to mainnet
- [ ] Update FCL config to mainnet
- [ ] Test all flows on mainnet
- [ ] Add error reporting (Sentry, etc.)
- [ ] Add analytics (Google Analytics, etc.)
- [ ] Implement caching strategy
- [ ] Add loading optimizations
- [ ] Set up CDN for assets
- [ ] Configure domain and SSL
- [ ] Test wallet compatibility

---

## Support Resources

### Documentation
- **Flow Documentation**: https://developers.flow.com/
- **FCL Documentation**: https://developers.flow.com/tools/clients/fcl-js
- **EsusuChain Docs**: See README.md

### Explorers
- **FlowScan Testnet**: https://testnet.flowscan.io/
- **View Contracts**: Search for `0xa89655a0f8e3d113`

### Getting Help
- Check the INTEGRATION_SUMMARY.md for technical details
- Review HACKATHON_DEMO.md for demo guide
- Check Flow Discord for community support

---

## Next Steps

After getting familiar with the basics:

1. **Create Multiple Circles**: Test with different configurations
2. **Invite Friends**: Share circle IDs with others to join
3. **Monitor Progress**: Watch as cycles complete automatically
4. **Explore Code**: Check out the hooks in `frontend/src/hooks/`
5. **Customize UI**: Modify components in `frontend/src/pages/`

---

## FAQ

**Q: Do I need to pay gas fees?**
A: Yes, on testnet you pay with testnet FLOW (free from faucet). On mainnet, you'll pay real gas fees.

**Q: Can I cancel a circle?**
A: Not yet implemented. Coming in future update.

**Q: What happens if I don't have enough FLOW?**
A: The contribution pull will fail. You need to maintain sufficient balance.

**Q: How often do contributions get pulled?**
A: Based on the cycle duration you set (daily, weekly, monthly, or custom).

**Q: Is this safe?**
A: Yes! The vault capability pattern ensures the contract can only withdraw the exact contribution amount, never more.

**Q: Can I see my transaction history?**
A: Check FlowScan with your wallet address to see all transactions.

---

## Keyboard Shortcuts

- **Escape**: Close modals (future feature)
- **Ctrl/Cmd + K**: Search circles (future feature)
- **Ctrl/Cmd + N**: Create new circle (future feature)

---

**Ready to save on-chain? Let's go! 🚀**

Visit: `http://localhost:5173`

---

*Built with ❤️ on Flow Blockchain*
