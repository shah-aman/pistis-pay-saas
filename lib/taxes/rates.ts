// Tax rates by country for demo purposes
// In production, integrate with a tax API like TaxJar or Avalara

export interface TaxInfo {
  rate: number;
  name: string;
}

export interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
  total: number;
}

// Tax rates by country code (ISO 3166-1 alpha-2)
export const TAX_RATES: Record<string, TaxInfo> = {
  // North America
  US: { rate: 0, name: 'No Tax' }, // Sales tax varies by state
  CA: { rate: 13, name: 'GST/HST' }, // Varies by province, using average
  MX: { rate: 16, name: 'IVA' },
  
  // Europe
  GB: { rate: 20, name: 'VAT' },
  DE: { rate: 19, name: 'VAT' },
  FR: { rate: 20, name: 'VAT' },
  IT: { rate: 22, name: 'VAT' },
  ES: { rate: 21, name: 'VAT' },
  NL: { rate: 21, name: 'VAT' },
  SE: { rate: 25, name: 'VAT' },
  PL: { rate: 23, name: 'VAT' },
  IE: { rate: 23, name: 'VAT' },
  AT: { rate: 20, name: 'VAT' },
  BE: { rate: 21, name: 'VAT' },
  DK: { rate: 25, name: 'VAT' },
  FI: { rate: 24, name: 'VAT' },
  PT: { rate: 23, name: 'VAT' },
  CZ: { rate: 21, name: 'VAT' },
  RO: { rate: 19, name: 'VAT' },
  GR: { rate: 24, name: 'VAT' },
  
  // Asia Pacific
  IN: { rate: 18, name: 'GST' },
  CN: { rate: 13, name: 'VAT' },
  JP: { rate: 10, name: 'Consumption Tax' },
  KR: { rate: 10, name: 'VAT' },
  AU: { rate: 10, name: 'GST' },
  NZ: { rate: 15, name: 'GST' },
  SG: { rate: 8, name: 'GST' },
  MY: { rate: 6, name: 'SST' },
  TH: { rate: 7, name: 'VAT' },
  ID: { rate: 11, name: 'VAT' },
  PH: { rate: 12, name: 'VAT' },
  VN: { rate: 10, name: 'VAT' },
  
  // Middle East & Africa
  AE: { rate: 5, name: 'VAT' },
  SA: { rate: 15, name: 'VAT' },
  IL: { rate: 17, name: 'VAT' },
  ZA: { rate: 15, name: 'VAT' },
  NG: { rate: 7.5, name: 'VAT' },
  KE: { rate: 16, name: 'VAT' },
  
  // Latin America
  BR: { rate: 17, name: 'ICMS' },
  AR: { rate: 21, name: 'IVA' },
  CL: { rate: 19, name: 'IVA' },
  CO: { rate: 19, name: 'IVA' },
  PE: { rate: 18, name: 'IGV' },
};

/**
 * Calculate tax for a given amount and country
 * @param amount - Base amount in USDC (before tax)
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Tax calculation breakdown
 */
export function calculateTax(amount: number, countryCode: string): TaxCalculation {
  const taxInfo = TAX_RATES[countryCode.toUpperCase()] || { rate: 0, name: 'No Tax' };
  const taxAmount = (amount * taxInfo.rate) / 100;
  const total = amount + taxAmount;

  return {
    subtotal: amount,
    taxAmount,
    taxRate: taxInfo.rate,
    taxName: taxInfo.name,
    total,
  };
}

/**
 * Get tax information for a country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Tax info or null if not found
 */
export function getTaxInfo(countryCode: string): TaxInfo | null {
  return TAX_RATES[countryCode.toUpperCase()] || null;
}

/**
 * Get all supported countries with tax rates
 * @returns Array of country codes and tax info
 */
export function getAllTaxRates(): Array<{ code: string; info: TaxInfo }> {
  return Object.entries(TAX_RATES).map(([code, info]) => ({ code, info }));
}

/**
 * Format tax amount for display
 * @param amount - Tax amount
 * @returns Formatted string
 */
export function formatTaxAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}



