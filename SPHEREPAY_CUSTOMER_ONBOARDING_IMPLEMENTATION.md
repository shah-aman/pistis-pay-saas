# SpherePay Customer Onboarding Implementation

## Overview

The merchant onboarding flow has been completely rebuilt to follow the correct SpherePay customer registration process as documented at [https://docs.spherepay.co/guide/customer/customer-registration/](https://docs.spherepay.co/guide/customer/customer-registration/).

## What Changed

### ❌ Old Flow (Removed)
- 6 complex steps with unnecessary data collection
- Steps: Information → Documents → Directors → Shareholders → Partners → Transfers
- Collected: PEP checks, US citizen checks, shareholder details, director information
- Did not integrate with SpherePay's customer registration API

### ✅ New Flow (Implemented)
- 4 streamlined steps following SpherePay's official flow
- Steps: Business Info → Terms of Service → KYC Verification → Bank Account (Optional)
- Fully integrated with SpherePay v2 API
- Stores customer ID for future use
- Bank account registration optional and repeatable

## Implementation Details

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added new fields to the `Merchant` model:
- `sphereCustomerId` - Unique ID from SpherePay for customer identity
- `kycStatus` - Tracks KYC completion status (pending, in_progress, verified, rejected)
- `tosAcceptedAt` - Timestamp when TOS was accepted
- `sphereBankAccountId` - Reference to registered bank account
- `addressLine1`, `addressLine2`, `addressCity`, `addressPostalCode`, `addressState`, `addressCountry` - Business address fields
- `phoneNumber` - Business phone number

**Migration:** `prisma/migrations/add_sphere_customer_onboarding_fields/migration.sql`

Run migration with:
```bash
npx prisma migrate deploy
```

### 2. SpherePay Client Methods

**File:** `lib/sphere/client.ts`

Added new methods for customer onboarding:
- `createCustomer()` - POST `/v2/customer` - Create a SpherePay customer
- `generateTosLink()` - POST `/v2/customer/:customer_id/tos-link` - Generate TOS link
- `generateKycLink()` - POST `/v2/customer/:customer_id/kyc-link` - Generate KYC link
- `getCustomerStatus()` - GET `/v2/customer/:customer_id` - Check customer status
- `registerBankAccount()` - POST `/v2/customers/:customer_id/bank-account` - Register bank account
- `getBankAccounts()` - GET `/v2/customers/:customer_id/bank-accounts` - List bank accounts

### 3. TypeScript Types

**File:** `types/sphere.ts`

Added comprehensive types for:
- `SphereCustomer` - Customer object from SpherePay
- `CreateSphereCustomerParams` - Customer creation parameters
- `SphereTosLink` - TOS link response
- `SphereKycLink` - KYC link response
- `SphereCustomerStatus` - Customer status response
- `SphereBankAccount` - Bank account object
- `CreateSphereBankAccountParams` - Bank account creation parameters

### 4. New Onboarding Flow

**File:** `app/(login)/onboarding/merchant-onboarding.tsx`

Complete rebuild with 4 steps:

#### Step 1: Business Information
Collects:
- Business name
- Email (prefilled from auth)
- Phone number
- Full business address (line1, line2, city, state, postal code, country)

Creates SpherePay customer and stores `sphereCustomerId` in database.

#### Step 2: Terms of Service
- Generates TOS link from SpherePay
- Redirects user to SpherePay TOS page
- After acceptance, redirects back to app
- Updates `tosAcceptedAt` timestamp

#### Step 3: KYC/KYB Verification
- Generates KYC link from SpherePay
- Redirects user to SpherePay KYC page
- Provides "Check KYC Status" button to poll status
- Updates `kycStatus` in database
- Can proceed to bank account step anytime

#### Step 4: Bank Account (Optional)
Collects:
- Account name
- Bank name
- Account holder name
- Currency (USD, EUR, GBP, CAD)
- Account number
- Routing number
- Account type (checking/savings)
- Beneficiary address

Two options:
- "Skip for Now" - Complete onboarding without bank account
- "Add Bank Account & Complete" - Register bank account and complete

### 5. Server Actions

**File:** `app/(login)/onboarding/actions.ts`

New server actions:
- `createSphereCustomer()` - Handles Step 1, creates customer in SpherePay
- `handleTosReturn()` - Handles return from TOS page, generates KYC link
- `checkCustomerStatus()` - Polls SpherePay for KYC status
- `addBankAccount()` - Registers bank account with SpherePay
- `skipBankAccount()` - Completes onboarding without bank account
- `completeOnboarding()` - Redirects to dashboard

### 6. API Routes

**TOS Callback:** `app/api/onboarding/tos-callback/route.ts`
- Handles callback from SpherePay after TOS acceptance
- Updates `tosAcceptedAt` in database
- Redirects to onboarding Step 3

**KYC Callback:** `app/api/onboarding/kyc-callback/route.ts`
- Handles callback from SpherePay after KYC completion
- Updates `kycStatus` in database
- Redirects to appropriate onboarding step

**Customer Status:** `app/api/onboarding/customer-status/route.ts`
- API endpoint for polling customer status
- Called by frontend to check KYC completion

**Bank Accounts:** `app/api/bank-accounts/route.ts`
- Fetches bank accounts for current merchant
- Used by dashboard settings page

### 7. Dashboard Settings Integration

**Component:** `components/dashboard/bank-account-manager.tsx`
- Displays existing bank accounts with status
- "Add Bank Account" button to register new accounts
- Reuses the same bank account form from onboarding
- Shows account status (Active, Pending, Rejected)

**Page:** `app/(dashboard)/dashboard/settings/page.tsx`
- Added `BankAccountManager` component
- Shows sphereCustomerId and sphereBankAccountId
- Allows adding bank accounts post-onboarding

## How to Use

### For Merchants (Onboarding Flow)

1. **Sign up** for an account at `/sign-up`
2. **Redirected to onboarding** at `/onboarding`
3. **Step 1:** Fill in business information and address
4. **Step 2:** Click button → Redirect to SpherePay TOS page → Accept TOS → Redirect back
5. **Step 3:** Click button → Redirect to SpherePay KYC page → Complete KYC → Redirect back
6. **Step 4:** Either skip or add a bank account
7. **Complete** → Redirect to dashboard

### For Merchants (Adding Bank Account Later)

1. Go to **Dashboard → Settings**
2. Scroll to **Bank Accounts** section
3. Click **"Add Bank Account"**
4. Fill in bank account details
5. Click **"Add Bank Account"** to submit

### For Developers

#### Configuration

Set these environment variables in `.env`:
```bash
# SpherePay API Configuration
SPHERE_API_KEY=your_sphere_api_key
SPHERE_API_BASE_URL=https://api.sandbox.spherepay.co  # or production URL
NEXT_PUBLIC_SPHERE_ENV=sandbox  # or production

# Database
DATABASE_URL=your_postgresql_connection_string
```

#### Database Migration

Run the migration to add new fields:
```bash
npx prisma migrate deploy
```

Or apply manually if needed:
```bash
psql $DATABASE_URL < prisma/migrations/add_sphere_customer_onboarding_fields/migration.sql
```

#### SpherePay Callback URLs

Configure these callback URLs in SpherePay dashboard:
- **TOS Callback:** `https://yourdomain.com/api/onboarding/tos-callback`
- **KYC Callback:** `https://yourdomain.com/api/onboarding/kyc-callback`

## Key Features

✅ **Correct SpherePay Flow** - Follows official documentation exactly  
✅ **Customer ID Storage** - Stores `sphereCustomerId` for future API calls  
✅ **KYC Status Tracking** - Real-time KYC status polling and updates  
✅ **Optional Bank Account** - Can be added during onboarding or later  
✅ **Multiple Bank Accounts** - Supports adding multiple bank accounts  
✅ **Type Safety** - Full TypeScript coverage with proper types  
✅ **Error Handling** - Graceful error handling with user-friendly messages  
✅ **Resumable Flow** - Can resume onboarding if interrupted  
✅ **Dashboard Integration** - Bank account management in settings  

## Files Modified/Created

### Modified
- `prisma/schema.prisma` - Added customer onboarding fields
- `lib/sphere/client.ts` - Added customer API methods
- `types/sphere.ts` - Added customer types
- `app/(login)/onboarding/actions.ts` - Complete rewrite
- `app/(login)/onboarding/merchant-onboarding.tsx` - Complete rewrite
- `app/(dashboard)/dashboard/settings/page.tsx` - Added bank account manager

### Created
- `prisma/migrations/add_sphere_customer_onboarding_fields/migration.sql` - Database migration
- `app/api/onboarding/tos-callback/route.ts` - TOS callback handler
- `app/api/onboarding/kyc-callback/route.ts` - KYC callback handler
- `app/api/onboarding/customer-status/route.ts` - Status check endpoint
- `app/api/bank-accounts/route.ts` - Bank accounts endpoint
- `components/dashboard/bank-account-manager.tsx` - Bank account management component

## Testing Checklist

- [ ] Sign up new user
- [ ] Complete Step 1 (Business Info)
- [ ] Verify customer created in SpherePay
- [ ] Complete Step 2 (TOS acceptance)
- [ ] Complete Step 3 (KYC verification)
- [ ] Check KYC status button works
- [ ] Skip bank account and reach dashboard
- [ ] Add bank account from settings
- [ ] Verify bank account appears in SpherePay
- [ ] Test with sandbox environment
- [ ] Test callback URLs work correctly

## Support

For issues related to:
- **SpherePay API:** Check [SpherePay Documentation](https://docs.spherepay.co/)
- **Customer Registration:** [Customer Registration Guide](https://docs.spherepay.co/guide/customer/customer-registration/)
- **Bank Accounts:** [Bank Account API](https://docs.spherepay.co/api-reference/bank-account/post/)

## Notes

- All KYC/KYB verification is handled by SpherePay
- No PEP checks or document uploads in our app
- Customer type is hardcoded to "business" as requested
- Bank account registration is optional but recommended
- Multiple bank accounts can be registered per customer
- The flow supports resuming from any step if interrupted


