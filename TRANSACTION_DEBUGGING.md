# Transaction Debugging Guide

## If Transaction Shows Error But Actually Went Through

This is a known issue with some Solana wallet adapters where the transaction succeeds but the wallet throws a generic "Unexpected error".

### Step 1: Check Your Wallet

1. Open your Phantom/Solflare wallet
2. Click on the activity/history tab
3. Look for the recent USDC transaction
4. Copy the transaction signature (long string of characters)

### Step 2: Verify on Solana Explorer

1. Go to https://explorer.solana.com/?cluster=devnet
2. Paste your transaction signature in the search box
3. Check if the transaction status shows "Success" ✅

### Step 3: Check Browser Console

Open browser DevTools (F12) and look for these logs:

```
[Solana] Creating transaction: { ... }
[Solana] Token accounts: { ... }
[SolanaPay] Sending transaction...
[SolanaPay] Send transaction error details: { ... }
```

### Common Causes of "Unexpected Error"

1. **Wallet Adapter Bug**: Some wallets throw errors even when transactions succeed
2. **Preflight Check**: Transaction simulation fails but actual transaction succeeds
3. **Network Latency**: Timeout during confirmation but transaction was broadcast

### Solutions

#### If Transaction Succeeded (Check Explorer)
- ✅ Transaction went through successfully
- ❌ UI shows error incorrectly
- **Action**: The payment should be recorded in database if signature is valid

#### If Transaction Failed (Not on Explorer)
- Check SOL balance for gas fees
- Check USDC balance
- Try with `skipPreflight: true` (already enabled)

### Manual Transaction Verification

If you have the transaction signature, you can manually confirm the payment:

```bash
# Check transaction status
solana confirm <SIGNATURE> --url devnet

# Get transaction details
solana transaction-history <YOUR_WALLET_ADDRESS> --url devnet
```

### Report Transaction Issues

If you consistently see errors but transactions succeed, include:

1. **Wallet**: Which wallet you're using (Phantom, Solflare, etc.)
2. **Browser Console Logs**: Copy all `[Solana]` and `[SolanaPay]` logs
3. **Transaction Signature**: From your wallet history
4. **Explorer Link**: Link to the transaction on Solana Explorer

## Transaction Flow

Here's what should happen:

1. ✅ Connect wallet
2. ✅ Click "Pay X USDC"
3. ✅ Wallet opens with transaction details
4. ✅ User approves transaction
5. ✅ Transaction is broadcast to Solana network
6. ✅ Transaction signature is returned
7. ✅ Frontend confirms transaction with backend
8. ✅ Payment is marked as complete

If the error occurs at step 5/6 but the transaction still appears in your wallet, it's likely a wallet adapter issue that doesn't affect the actual payment.


