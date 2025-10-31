import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { encodeURL, createQR, EncodeURLComponents } from '@solana/pay';
import {
  SOLANA_RPC_URL,
  getUsdcMint,
  getPlatformWallet,
  COMMITMENT,
  MAX_CONFIRMATION_RETRIES,
  CONFIRMATION_RETRY_DELAY,
} from './constants';

/**
 * Create a Solana Pay URL for a USDC payment
 * This generates a URL that can be encoded in a QR code or used as a deep link
 */
export function createPaymentUrl(
  amount: number,
  paymentId: string,
  label?: string,
  message?: string
): URL {
  const recipient = getPlatformWallet();
  const usdcMint = getUsdcMint();

  // Create reference public key from payment ID
  // This helps us track which payment this transaction is for
  const reference = new PublicKey(
    // Convert payment ID to a valid public key by hashing it
    // For now, we'll use a deterministic approach
    Buffer.from(paymentId.padEnd(32, '0').slice(0, 32))
  );

  const urlParams: EncodeURLComponents = {
    recipient,
    amount,
    splToken: usdcMint,
    reference,
    label: label || 'SolaPay Checkout',
    message: message || `Payment ${paymentId}`,
  };

  return encodeURL(urlParams);
}

/**
 * Create a USDC transfer transaction
 * This creates an unsigned transaction that transfers USDC from payer to platform wallet
 */
export async function createTransferTransaction(
  payerPublicKey: PublicKey,
  amount: number,
  paymentId: string
): Promise<Transaction> {
  const connection = new Connection(SOLANA_RPC_URL, COMMITMENT);
  const recipient = getPlatformWallet();
  const usdcMint = getUsdcMint();

  // Get associated token accounts
  const payerTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    payerPublicKey
  );

  const recipientTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    recipient
  );

  // Convert amount to token decimals (USDC has 6 decimals)
  const amountInSmallestUnit = Math.floor(amount * 1_000_000);

  // Create transfer instruction
  const transferInstruction = createTransferCheckedInstruction(
    payerTokenAccount,
    usdcMint,
    recipientTokenAccount,
    payerPublicKey,
    amountInSmallestUnit,
    6 // USDC decimals
  );

  // Add memo instruction with payment ID for tracking
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`SolaPay:${paymentId}`, 'utf-8'),
  });

  // Create transaction
  const transaction = new Transaction();
  transaction.add(transferInstruction);
  transaction.add(memoInstruction);

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(COMMITMENT);
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = payerPublicKey;

  return transaction;
}

/**
 * Verify a transaction on-chain
 * Checks that the transaction exists, is confirmed, and contains the correct payment details
 */
export async function verifyTransaction(
  signature: string,
  expectedAmount: number,
  expectedRecipient?: PublicKey
): Promise<{
  verified: boolean;
  amount?: number;
  recipient?: string;
  sender?: string;
  error?: string;
}> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, COMMITMENT);
    const recipient = expectedRecipient || getPlatformWallet();
    const usdcMint = getUsdcMint();

    // Get transaction details
    const tx = await connection.getTransaction(signature, {
      commitment: COMMITMENT,
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (tx.meta?.err) {
      return { verified: false, error: 'Transaction failed on-chain' };
    }

    // Parse transaction to find token transfer
    const recipientTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      recipient
    );

    // Check post token balances to verify the transfer
    const postTokenBalances = tx.meta?.postTokenBalances || [];
    const preTokenBalances = tx.meta?.preTokenBalances || [];

    // Find the recipient's token account in post balances
    const recipientPostBalance = postTokenBalances.find(
      (balance) => balance.owner === recipient.toBase58()
    );

    const recipientPreBalance = preTokenBalances.find(
      (balance) => balance.owner === recipient.toBase58()
    );

    if (!recipientPostBalance || !recipientPreBalance) {
      return { verified: false, error: 'Could not find token balances' };
    }

    // Calculate transferred amount (in USDC with 6 decimals)
    const postAmount = recipientPostBalance.uiTokenAmount.uiAmount || 0;
    const preAmount = recipientPreBalance.uiTokenAmount.uiAmount || 0;
    const transferredAmount = postAmount - preAmount;

    // Verify amount matches (with small tolerance for rounding)
    const amountMatches = Math.abs(transferredAmount - expectedAmount) < 0.01;

    if (!amountMatches) {
      return {
        verified: false,
        error: `Amount mismatch: expected ${expectedAmount}, got ${transferredAmount}`,
        amount: transferredAmount,
      };
    }

    // Get sender from transaction
    const sender = tx.transaction.message.accountKeys[0]?.toBase58();

    return {
      verified: true,
      amount: transferredAmount,
      recipient: recipient.toBase58(),
      sender,
    };
  } catch (error) {
    console.error('[Solana] Transaction verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wait for transaction confirmation with retries
 */
export async function waitForTransactionConfirmation(
  signature: string,
  maxRetries = MAX_CONFIRMATION_RETRIES
): Promise<boolean> {
  const connection = new Connection(SOLANA_RPC_URL, COMMITMENT);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (status.value?.confirmationStatus === 'confirmed' || 
          status.value?.confirmationStatus === 'finalized') {
        return true;
      }

      if (status.value?.err) {
        console.error('[Solana] Transaction failed:', status.value.err);
        return false;
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, CONFIRMATION_RETRY_DELAY));
    } catch (error) {
      console.error(`[Solana] Confirmation check ${i + 1}/${maxRetries} failed:`, error);
      
      if (i === maxRetries - 1) {
        return false;
      }
      
      await new Promise((resolve) => setTimeout(resolve, CONFIRMATION_RETRY_DELAY));
    }
  }

  return false;
}

/**
 * Generate QR code data for Solana Pay
 */
export async function generatePaymentQR(
  amount: number,
  paymentId: string,
  label?: string,
  message?: string
): Promise<string> {
  const url = createPaymentUrl(amount, paymentId, label, message);
  const qr = createQR(url, 512, 'transparent');
  
  // Convert QR code to data URL
  const qrBlob = await qr.getRawData('png');
  if (!qrBlob) {
    throw new Error('Failed to generate QR code');
  }

  // Convert blob to base64 data URL
  const buffer = await qrBlob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}

