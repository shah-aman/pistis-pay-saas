# SphereRamp MOR Testing Guide

## Prerequisites

1. **Environment Variables Set:**
   ```bash
   NEXT_PUBLIC_SPHERE_APP_ID=your_sphere_application_id
   PLATFORM_WALLET_ADDRESS=your_platform_wallet_address
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Database Migrated:**
   ```bash
   pnpm prisma db push
   ```

3. **Development Server Running:**
   ```bash
   pnpm dev
   ```

## Test Flow

### 1. Create Payment Link

1. Navigate to dashboard: `http://localhost:3000/dashboard`
2. Click "Create Payment Link" button
3. Fill in form:
   - Amount: `100`
   - Description: `Test Payment`
   - Redirect URL: (optional)
4. Click "Create Payment Link"
5. **Expected:** Modal shows checkout URL and invoice number
6. **Copy the checkout URL** (e.g., `http://localhost:3000/checkout/abc123...`)

### 2. Customer Checkout Experience

1. Open checkout URL in **new incognito/private window** (to simulate customer)
2. **Expected:** Checkout page loads with:
   - Payment details
   - Country selector (auto-detected or default)
   - Payment breakdown showing subtotal, tax, and total
   - SphereRamp widget loading

3. **Test Country Selection:**
   - Change country dropdown (e.g., US → GB)
   - **Expected:** Tax recalculates immediately
   - US: 0% tax
   - GB: 20% VAT
   - Subtotal stays same, tax and total update

4. **Test SphereRamp Widget:**
   - Widget should load in the right column
   - **If widget doesn't load:** Check console for errors
   - **Common issue:** Missing `NEXT_PUBLIC_SPHERE_APP_ID`

### 3. Complete Payment (Simulated)

**Note:** Actual payment requires:
- Valid Sphere Application ID
- Configured Sphere account
- Solana wallet with USDC

For testing without real payment:
1. Check if widget loads
2. Verify all UI elements display correctly
3. Test country changes update tax calculation

### 4. View Receipt

1. After payment (or manually navigate to):
   ```
   http://localhost:3000/receipt/[payment-id]
   ```
2. **Expected Receipt Shows:**
   - Invoice number (e.g., INV-20251031-XXXXX)
   - Merchant details
   - Customer wallet (if available)
   - Customer country
   - Payment breakdown with tax
   - Transaction signature (if completed)
   - Payment status

### 5. Settlement Tracking

1. Navigate to settlements page:
   ```
   http://localhost:3000/dashboard/settlements
   ```
2. **Expected:**
   - Summary cards (Pending, Settled, Total)
   - Pending tab shows payments awaiting settlement
   - Settled tab shows completed settlements
   - **Note:** New payments start as "pending" settlement

## Manual Testing Scenarios

### Scenario 1: Zero-Tax Country
- Create payment: $100
- Select country: US
- **Expected:** 
  - Subtotal: $100.00
  - Tax: $0.00
  - Total: $100.00

### Scenario 2: High-Tax Country
- Create payment: $100
- Select country: Sweden (SE)
- **Expected:**
  - Subtotal: $100.00
  - Tax (VAT 25%): $25.00
  - Total: $125.00

### Scenario 3: Invoice Generation
- Create 3 different payments
- **Expected:** Each has unique invoice number
- Format: `INV-YYYYMMDD-XXXXX`
- No duplicates

### Scenario 4: Multiple Country Changes
- Create payment checkout
- Change country 5 times
- **Expected:** 
  - Tax updates each time
  - No errors or delays
  - Final tax saved to database

## API Testing with curl

### 1. Create Payment Link
```bash
curl -X POST http://localhost:3000/api/payments/create-link \
  -H "Content-Type: application/json" \
  -H "Cookie: supabase-auth-token=YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "description": "Test Payment",
    "redirectUrl": "https://example.com/success"
  }'
```

**Expected Response:**
```json
{
  "payment": {
    "id": "uuid",
    "checkoutUrl": "http://localhost:3000/checkout/uuid",
    "receiptUrl": "http://localhost:3000/receipt/uuid",
    "invoiceNumber": "INV-20251031-XXXXX",
    "amount": 100,
    "description": "Test Payment",
    "status": "pending",
    "createdAt": "2025-10-31T..."
  }
}
```

### 2. Get Checkout Details
```bash
curl http://localhost:3000/api/checkout/[payment-id]
```

**Expected Response:**
```json
{
  "payment": {
    "id": "uuid",
    "amount": 100,
    "description": "Test Payment",
    "merchantName": "Merchant's Business",
    "merchantCountry": "US",
    "status": "pending",
    "createdAt": "..."
  },
  "tax": {
    "subtotal": 100,
    "taxAmount": 0,
    "taxRate": 0,
    "taxName": "No Tax",
    "taxCountry": "US",
    "total": 100
  }
}
```

### 3. Update Country
```bash
curl -X PATCH http://localhost:3000/api/checkout/[payment-id] \
  -H "Content-Type: application/json" \
  -d '{"country": "GB"}'
```

**Expected Response:**
```json
{
  "tax": {
    "subtotal": 100,
    "taxAmount": 20,
    "taxRate": 20,
    "taxName": "VAT",
    "taxCountry": "GB",
    "total": 120
  }
}
```

## Database Verification

### Check Payment Record
```sql
SELECT 
  id,
  invoice_number,
  amount_usdc,
  tax_amount,
  tax_country,
  tax_rate,
  settlement_status,
  platform_wallet_received
FROM payments
WHERE id = 'your-payment-id';
```

**Expected After Creation:**
- `invoice_number`: INV-YYYYMMDD-XXXXX
- `amount_usdc`: 100.000000
- `tax_amount`: NULL (until country selected)
- `tax_country`: NULL (until country selected)
- `settlement_status`: 'pending'
- `platform_wallet_received`: false

**Expected After Country Selection:**
- `tax_amount`: 20.000000 (if GB selected)
- `tax_country`: 'GB'
- `tax_rate`: 20.00

## Common Issues & Solutions

### Issue: Widget Doesn't Load
**Solutions:**
1. Check `NEXT_PUBLIC_SPHERE_APP_ID` is set
2. Check browser console for script loading errors
3. Verify internet connection (widget loads from CDN)
4. Try different browser

### Issue: Tax Not Updating
**Solutions:**
1. Check browser console for API errors
2. Verify `/api/checkout/[id]` PATCH endpoint works
3. Check database has `tax_*` columns
4. Clear browser cache

### Issue: 404 on Checkout Page
**Solutions:**
1. Verify payment ID is correct
2. Check payment exists in database
3. Ensure payment status is 'pending'
4. Check Next.js dynamic routes are working

### Issue: Receipt Shows Wrong Amount
**Solutions:**
1. Verify tax calculation in API
2. Check `getTaxInfo()` returns correct rate
3. Verify database has correct tax_amount
4. Check receipt API includes tax in total

## Success Criteria

✅ **All tests pass if:**
1. Payment link creates successfully
2. Checkout page loads and displays correctly
3. Country selection updates tax in real-time
4. SphereRamp widget attempts to load (even if no config)
5. Receipt page shows complete invoice with tax
6. Settlement tracking displays payments
7. Invoice numbers are unique
8. Tax calculations are accurate

## Next: Production Testing

Once local testing is complete:
1. Get real Sphere Application ID
2. Configure production environment
3. Test with real USDC (small amount first)
4. Verify webhooks work
5. Test complete payment → settlement flow

---

**Happy Testing! 🚀**

