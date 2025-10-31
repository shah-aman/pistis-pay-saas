import { clusterApiUrl, PublicKey } from '@solana/web3.js';

// Solana network configuration
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet';

export const SOLANA_RPC_URL = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  clusterApiUrl(SOLANA_NETWORK);

// USDC token mint addresses
export const USDC_MINT = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  'devnet': new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'),
  'testnet': new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'),
};

// Get USDC mint address for current network
export function getUsdcMint(): PublicKey {
  const mintAddress = process.env.NEXT_PUBLIC_USDC_MINT_ADDRESS;
  if (mintAddress) {
    return new PublicKey(mintAddress);
  }
  return USDC_MINT[SOLANA_NETWORK];
}

// Platform wallet that receives payments (MOR wallet)
export function getPlatformWallet(): PublicKey {
  const walletAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS;
  if (!walletAddress) {
    throw new Error(
      'NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS environment variable is not set. ' +
      'Please add your platform wallet address to receive payments.'
    );
  }
  return new PublicKey(walletAddress);
}

// Transaction confirmation commitment level
export const COMMITMENT = 'confirmed';

// Maximum number of retries for transaction confirmation
export const MAX_CONFIRMATION_RETRIES = 30;

// Delay between retries (in milliseconds)
export const CONFIRMATION_RETRY_DELAY = 2000;

