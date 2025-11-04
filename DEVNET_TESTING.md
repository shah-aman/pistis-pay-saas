# Devnet Testing Guide

## Prerequisites for Testing Solana Pay

To test the payment flow on devnet, you need:

1. **Devnet SOL** (for transaction fees)
2. **Devnet USDC** (to make payments)

## Step 1: Get Devnet SOL

### Option A: Solana CLI
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

### Option B: Web Faucet
Visit: https://faucet.solana.com/
- Select "Devnet"
- Enter your wallet address
- Request 2 SOL

## Step 2: Get Circle USDC on Devnet

### Using Circle's USDC Faucet (Recommended)
Circle's official USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

Visit: https://faucet.circle.com/
- Connect your wallet
- Select "Solana Devnet"
- Request USDC tokens

### Alternative: SPL Token Faucet
Visit: https://spl-token-faucet.com/?token-name=USDC-Dev
- Connect your wallet
- Select "Devnet"
- Make sure you're getting the Circle USDC (mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU)
- Request tokens (usually 100 USDC)

## Step 3: Verify Your Tokens

Check your wallet to confirm you have:
- ✅ At least 0.5 SOL (for transaction fees)
- ✅ At least 1 USDC (to make test payments)

## Testing the Payment Flow

1. Navigate to the checkout page
2. Connect your Phantom/Solflare wallet
3. Click "Pay 0.10 USDC"
4. Approve the transaction in your wallet

## Common Issues

### "Insufficient SOL for transaction fees"
- **Solution**: Get more devnet SOL from the faucet

### "Insufficient USDC balance"
- **Solution**: Get devnet USDC from the SPL token faucet

### "USDC token account not found"
- **Solution**: The transaction will automatically create the token account if you have enough SOL

### "Unexpected error"
- Check the browser console for detailed error messages
- Ensure you're on devnet network in your wallet
- Verify you have both SOL and USDC

## Environment Configuration

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=42WBh2k93A74Q3THr7fctcbU2sXzqxoQLENMGXuMrE1x
```

## Useful Tools

- **Solana Explorer (Devnet)**: https://explorer.solana.com/?cluster=devnet
- **Check Transaction**: Paste your transaction signature to verify
- **Account Balance**: View your wallet's SOL and token balances

## Moving to Mainnet

When ready for production:

1. Update `.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=YOUR_MAINNET_WALLET
```

2. Consider using a dedicated RPC provider:
   - Helius: https://helius.dev
   - QuickNode: https://quicknode.com
   - Alchemy: https://alchemy.com

3. Update USDC mint to mainnet address (automatic based on network)

