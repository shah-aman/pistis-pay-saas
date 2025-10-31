# SolaPay Payment & Settlement Flow

## ✅ IMPLEMENTED: Solana Pay for Customer Checkout

**Architecture Decision:** We use **two separate systems** for different purposes:

1. **Customer Payments** → **Solana Pay** (Direct USDC wallet-to-wallet)
2. **Merchant Settlements** → **SpherePay Transfer API** (USDC to fiat bank account)

---

## 1. Customer Payment Flow (Solana Pay)

### How It Works

Customers pay USDC directly from their Solana wallets to the platform's MOR (Merchant of Record) wallet using **Solana Pay protocol**.

**Key Benefits:**
- ✅ No customer account creation required
- ✅ No KYC/verification for customers
- ✅ No intermediaries or custody
- ✅ Direct on-chain payments
- ✅ Works with any Solana wallet (Phantom, Solflare, etc.)

### Payment Methods

#### Option A: QR Code (Mobile Wallets)
1. Merchant creates payment link
2. Customer opens checkout page
3. QR code is displayed with payment details
4. Customer scans QR with mobile wallet app
5. Wallet auto-fills transaction details
6. Customer approves and signs transaction
7. Payment confirms on-chain
8. Receipt generated

#### Option B: Browser Wallet (Desktop)
1. Merchant creates payment link
2. Customer opens checkout page
3. Customer clicks "Connect Wallet"
4. Wallet extension prompts connection
5. Customer clicks "Pay" button
6. Wallet prompts transaction approval
7. Customer approves and signs
8. Payment confirms on-chain
9. Receipt generated

### Technical Implementation

**Components:**
- `lib/solana/payment.ts` - Payment service (transaction generation, verification)
- `lib/solana/constants.ts` - Network configuration
- `components/checkout/solana-pay-checkout.tsx` - Checkout UI component
- `app/api/payments/transaction/route.ts` - Transaction generation endpoint
- `app/api/payments/confirm/route.ts` - Payment confirmation endpoint

**Flow:**
```
Customer Wallet → USDC Transfer → Platform Wallet (MOR)
                     ↓
              On-chain confirmation
                     ↓
         Database status: completed
                     ↓
              Receipt generated
```

**Environment Variables:**
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta  # or devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=<platform_wallet_pubkey>
NEXT_PUBLIC_USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

---

## 2. Merchant Settlement Flow (SpherePay Transfer API)

### How It Works

Merchants withdraw their earnings by converting USDC to fiat currency in their bank account using **SpherePay Transfer API**.

**Key Use Cases:**
- Merchant withdrawals (USDC → USD/EUR/etc.)
- Automated settlement schedules
- Off-ramp for platform earnings

### SpherePay Integration

#### Transfer API
- **Endpoint:** `POST /v1/transfer`
- **Purpose:** Convert USDC to fiat and send to bank account
- **Authentication:** API key per merchant
- **Flow:**
  1. Merchant initiates withdrawal
  2. Platform calls SpherePay Transfer API
  3. USDC converted to fiat
  4. Fiat sent to merchant's bank account
  5. Webhook confirms completion

#### API Endpoints (Future Implementation)

**Base URLs:**
- Sandbox: `https://api.sandbox.spherepay.co`
- Production: `https://api.spherepay.co`

**Endpoints:**
- `/v1/transfer` - Create transfers (off-ramp USDC → fiat)
- `/v1/withdrawals` - List/manage withdrawals
- Webhook endpoints for status updates

---

## 3. What SpherePay is NOT Used For

### ❌ SphereRamp Widget (Deprecated for Checkout)

**Why NOT used:**
- SphereRamp is for **fiat on-ramp/off-ramp** (credit card → crypto)
- Requires customer account creation
- Requires KYC verification
- Requires email login
- NOT suitable for simple USDC checkout

**Correct Use Case for SphereRamp:**
- Only if customers need to BUY crypto with fiat first
- NOT for customers who already have USDC

### ❌ Payment Links / Virtual Accounts

**Status:** Not currently used
**Reason:** Solana Pay provides better UX for direct wallet payments

**Potential Future Use:**
- Could be used for additional payment methods
- Could support fiat payments if needed

---

## 4. Complete Payment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER PAYMENT                         │
│                    (Solana Pay)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Customer Wallet  ──(USDC)──→  Platform Wallet (MOR)       │
│                                                             │
│  • QR Code or Connect Wallet                                │
│  • No account needed                                        │
│  • Direct on-chain                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                   [Platform holds USDC]
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  MERCHANT SETTLEMENT                         │
│                  (SpherePay Transfer API)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Platform Wallet  ──(USDC)──→  SpherePay  ──(USD)──→  Bank │
│                                                             │
│  • Merchant initiates withdrawal                            │
│  • USDC converted to fiat                                   │
│  • Sent to merchant bank                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Status

### ✅ Completed
- [x] Solana Pay integration for customer payments
- [x] QR code generation
- [x] Browser wallet connection (Phantom, Solflare, etc.)
- [x] Transaction generation and verification
- [x] Payment confirmation flow
- [x] Receipt generation

### 🚧 To Be Implemented
- [ ] SpherePay Transfer API integration (merchant withdrawals)
- [ ] Automated settlement schedules
- [ ] Webhook handlers for SpherePay events
- [ ] Multi-currency support for settlements

---

## 6. Testing

### Customer Payment Flow
1. Create payment link from merchant dashboard
2. Open checkout page
3. Test QR code with mobile wallet (Phantom/Solflare)
4. Test browser wallet connection
5. Submit payment transaction
6. Verify on-chain confirmation
7. Check database status update
8. View generated receipt

### Merchant Settlement Flow (When Implemented)
1. Merchant initiates withdrawal
2. Verify SpherePay API call
3. Check USDC transfer
4. Confirm fiat deposit in bank
5. Update withdrawal status

