import { clusterApiUrl, PublicKey } from '@solana/web3.js';

// Solana network configuration
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet';

// Get the RPC URL with proper fallback
function getRpcUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }
  // Always use devnet as default fallback
  return clusterApiUrl('devnet');
}

export const SOLANA_RPC_URL = getRpcUrl();

// USDC token mint addresses
// Using Circle's official USDC mint addresses
export const USDC_MINT = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // Circle USDC on Mainnet
  'devnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Circle USDC on Devnet
  'testnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Circle USDC on Testnet
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
    // For development/testing, use a default devnet wallet
    // IN PRODUCTION, YOU MUST SET NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS
    console.warn(
      '⚠️  NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS not set. Using default devnet wallet for testing. ' +
      'Set this environment variable before going to production!'
    );
    // Default devnet test wallet (DO NOT USE IN PRODUCTION)
    return new PublicKey('DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M');
  }
  return new PublicKey(walletAddress);
}

// Transaction confirmation commitment level
export const COMMITMENT = 'confirmed';

// Maximum number of retries for transaction confirmation
export const MAX_CONFIRMATION_RETRIES = 30;

// Delay between retries (in milliseconds)
export const CONFIRMATION_RETRY_DELAY = 2000;


