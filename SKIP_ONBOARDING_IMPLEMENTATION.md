# Skip Onboarding Feature Implementation

## Overview

Users can now skip the SpherePay customer onboarding and complete it later. A prominent banner on the dashboard reminds users to complete the onboarding process.

## Features Implemented

### 1. ✅ Database Schema Updates

**File**: `prisma/schema.prisma`

Added new fields to `Merchant` model:
- `onboardingCompleted` - Boolean flag (default: false)
- `onboardingCompletedAt` - Timestamp when onboarding completed
- `onboardingSkippedAt` - Timestamp when user skipped onboarding

**Migration**: `prisma/migrations/add_onboarding_tracking/migration.sql`

### 2. ✅ Skip Button on All Onboarding Steps

**File**: `app/(login)/onboarding/merchant-onboarding.tsx`

- Added "Skip for Now" button on all 4 steps (Business Info, TOS, KYC, Bank Account)
- Shows confirmation dialog before skipping
- Dialog explains what needs to be completed
- User can choose to continue onboarding or skip

### 3. ✅ Server Actions

**File**: `app/(login)/onboarding/actions.ts`

Added/updated actions:
- `skipOnboarding()` - Sets `onboardingSkippedAt` timestamp, redirects to dashboard
- `completeOnboarding()` - Sets `onboardingCompleted = true` and timestamp
- `skipBankAccount()` - Marks onboarding complete even without bank account

### 4. ✅ Onboarding Banner Component

**File**: `components/dashboard/onboarding-banner.tsx`

Features:
- Orange/amber gradient background for high visibility
- Shows current onboarding step (1-4) and what's needed
- "Complete Now" button redirects to `/onboarding`
- "Dismiss" button hides banner for current session (localStorage)
- Banner reappears on page refresh
- Only shows when `onboardingCompleted = false`

### 5. ✅ Dashboard Integration

**File**: `app/(dashboard)/layout.tsx`

- Fetches merchant onboarding status
- Displays `OnboardingBanner` when onboarding is incomplete
- Banner positioned at top of dashboard, below navigation
- Doesn't force redirect to onboarding anymore (users can skip)

### 6. ✅ Merchant API Updates

**File**: `app/api/merchant/route.ts`

GET endpoint now includes:
- `onboardingCompleted`
- `onboardingCompletedAt`
- `onboardingSkippedAt`
- `sphereCustomerId`
- `kycStatus`
- `tosAcceptedAt`
- `sphereBankAccountId`

### 7. ✅ Resume Onboarding Logic

**File**: `app/(login)/onboarding/merchant-onboarding.tsx`

Smart resume functionality:
- **No `sphereCustomerId`** → Start at Step 1 (Business Info)
- **Has `sphereCustomerId`, no `tosAcceptedAt`** → Resume at Step 2 (TOS)
- **Has `tosAcceptedAt`, `kycStatus != 'verified'`** → Resume at Step 3 (KYC)
- **KYC verified, no `sphereBankAccountId`** → Resume at Step 4 (Bank Account)
- **`onboardingCompleted = true`** → Redirect to dashboard

## User Flow

### Skip Flow

1. User starts onboarding (`/onboarding`)
2. Clicks "Skip for Now" on any step
3. Sees confirmation dialog
4. Chooses "Skip for Now"
5. Redirected to `/dashboard`
6. Orange banner appears at top

### Resume Flow

1. User clicks "Complete Now" on dashboard banner
2. Redirected to `/onboarding`
3. Automatically resumes from last incomplete step
4. Completes remaining steps
5. Onboarding marked complete
6. Banner disappears

### Completion

Onboarding is marked complete when:
- User adds bank account and clicks "Add Bank Account & Complete"
- OR user clicks "Skip for Now" on Step 4 (bank account is optional)

## UI Components

### Skip Confirmation Dialog

```
┌─────────────────────────────────────────┐
│  Skip Onboarding?                       │
│  You can complete the SpherePay         │
│  onboarding process later from your     │
│  dashboard.                             │
│                                         │
│  To start accepting payments, you'll    │
│  need to complete:                      │
│  • Business information                 │
│  • Terms of Service acceptance          │
│  • KYC/KYB verification                 │
│  • Bank account (optional)              │
│                                         │
│  [Continue Onboarding] [Skip for Now]  │
└─────────────────────────────────────────┘
```

### Dashboard Banner

```
┌────────────────────────────────────────────────────┐
│ ⚠️  Complete SpherePay Onboarding                  │
│ Finish setting up your account to start accepting  │
│ payments.                                          │
│ Current: Step 2/4 • Accept the Terms of Service   │
│ to continue                                        │
│                                                    │
│ [Complete Now →]                        [×]        │
└────────────────────────────────────────────────────┘
```

## Database Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `onboardingCompleted` | Boolean | false | Whether onboarding is complete |
| `onboardingCompletedAt` | DateTime? | null | When onboarding was completed |
| `onboardingSkippedAt` | DateTime? | null | Last time user skipped onboarding |

## Testing

### Test Skip Functionality

1. Sign up new account
2. Start onboarding
3. Click "Skip for Now" on Step 1
4. Confirm skip in dialog
5. Verify redirect to dashboard
6. Verify banner appears

### Test Resume Functionality

1. Skip onboarding (as above)
2. Click "Complete Now" on banner
3. Verify return to Step 1
4. Fill Step 1, continue
5. Skip again on Step 2
6. Click "Complete Now" again
7. Verify resume at Step 2 (not Step 1)

### Test Banner Dismiss

1. Skip onboarding
2. On dashboard, click "×" to dismiss banner
3. Verify banner disappears
4. Refresh page
5. Verify banner reappears

### Test Completion

1. Complete all onboarding steps
2. Add bank account OR skip bank account
3. Verify redirect to dashboard
4. Verify banner does NOT appear
5. Try visiting `/onboarding`
6. Verify redirect back to dashboard

## Edge Cases Handled

1. **Multiple Skips**: Each skip updates `onboardingSkippedAt` timestamp
2. **Partial Completion**: Resume from last checkpoint automatically
3. **Already Completed**: Redirect to dashboard if visiting `/onboarding`
4. **Banner Dismiss**: Stored in localStorage, reappears on new session
5. **Mock Mode**: Works with `SPHERE_MOCK_MODE=true` for development
6. **No Force Redirect**: Users can access dashboard even without completing onboarding

## Environment Variables

No new environment variables required. Works with existing:
- `DATABASE_URL` - PostgreSQL connection
- `SPHERE_API_KEY` - SpherePay API key  
- `SPHERE_MOCK_MODE` - Optional, set to `true` for mock mode

## Migration

Run the migration to add new fields:

```bash
# Apply migration
npx prisma migrate deploy

# Or apply manually
psql $DATABASE_URL < prisma/migrations/add_onboarding_tracking/migration.sql

# Generate Prisma client
npx prisma generate
```

## Files Modified

### Modified
- `prisma/schema.prisma` - Added onboarding tracking fields
- `app/(login)/onboarding/merchant-onboarding.tsx` - Added skip button, dialog, resume logic
- `app/(login)/onboarding/actions.ts` - Added skip action, updated complete action
- `app/(dashboard)/layout.tsx` - Added banner integration
- `app/api/merchant/route.ts` - Added onboarding fields to response

### Created
- `prisma/migrations/add_onboarding_tracking/migration.sql` - Database migration
- `components/dashboard/onboarding-banner.tsx` - Banner component

## Benefits

✅ **Better UX**: Users aren't forced to complete onboarding immediately  
✅ **Persistent Reminder**: Banner ensures users don't forget  
✅ **Resume Anywhere**: Smart checkpoint system  
✅ **Optional Bank Account**: Can accept payments before adding bank details  
✅ **Session Dismissible**: Banner can be hidden temporarily  
✅ **Progress Tracking**: Shows exactly what step user is on  

## Next Steps

1. Test the flow thoroughly
2. Run database migration
3. Consider adding email reminders for incomplete onboarding
4. Track analytics on skip/completion rates
5. A/B test banner messaging

## Support

For issues:
- Check Prisma migration applied: `npx prisma migrate status`
- Verify database fields exist: Check `merchants` table
- Clear localStorage if banner stuck: `localStorage.clear()`
- Check browser console for errors


