'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSphereClient } from '@/lib/sphere/client';
import { getCurrentUser } from '../actions';
import { CreateSphereBankAccountParams } from '@/types/sphere';

// Step 1: Business Information Schema
const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  addressCity: z.string().min(1, 'City is required'),
  addressPostalCode: z.string().min(1, 'Postal code is required'),
  addressState: z.string().min(1, 'State is required'),
  addressCountry: z.string().length(2, 'Country code must be 2 characters'),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

/**
 * Step 1: Create SpherePay customer and store basic business info
 * Returns the TOS link URL for redirect
 */
export async function createSphereCustomer(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; tosUrl?: string; customerId?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'You must be logged in to complete onboarding.' };
    }

    // Parse and validate form data
    const rawData = {
      businessName: formData.get('businessName') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      addressLine1: formData.get('addressLine1') as string,
      addressLine2: formData.get('addressLine2') as string,
      addressCity: formData.get('addressCity') as string,
      addressPostalCode: formData.get('addressPostalCode') as string,
      addressState: formData.get('addressState') as string,
      addressCountry: formData.get('addressCountry') as string,
    };

    const parsed = businessInfoSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: 'Please fill in all required fields correctly.' };
    }

    const data = parsed.data;

    try {
      const sphereClient = createSphereClient();

      // Step 1: Create customer in SpherePay
      const customer = await sphereClient.createCustomer({
        type: 'business',
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: {
          line1: data.addressLine1,
          line2: data.addressLine2,
          city: data.addressCity,
          postalCode: data.addressPostalCode,
          state: data.addressState,
          country: data.addressCountry,
        },
      });

      // Step 2: Update merchant record with customer ID and business info
      await prisma.merchant.update({
        where: { id: user.merchant.id },
        data: {
          businessName: data.businessName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          country: data.addressCountry,
          sphereCustomerId: customer.id,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          addressCity: data.addressCity,
          addressPostalCode: data.addressPostalCode,
          addressState: data.addressState,
          addressCountry: data.addressCountry,
          kycStatus: 'pending',
        },
      });

      // Step 3: Generate TOS link
      const tosLink = await sphereClient.generateTosLink(customer.id);

      return {
        tosUrl: tosLink.url,
        customerId: customer.id,
      };
    } catch (sphereError: any) {
      console.error('SpherePay API error:', sphereError);
      return {
        error: `Failed to create customer in SpherePay: ${sphereError.message || 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('Customer creation error:', error);
    return {
      error: 'An error occurred during customer creation. Please try again.',
    };
  }
}

/**
 * Step 2: Handle return from TOS acceptance
 * Generate KYC link for next step
 */
export async function handleTosReturn(): Promise<{
  error?: string;
  kycUrl?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant.sphereCustomerId) {
      return { error: 'Customer not found. Please restart onboarding.' };
    }

    const sphereClient = createSphereClient();

    // Update TOS acceptance timestamp
    await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        tosAcceptedAt: new Date(),
      },
    });

    // Generate KYC link
    const kycLink = await sphereClient.generateKycLink(user.merchant.sphereCustomerId);

    return {
      kycUrl: kycLink.url,
    };
  } catch (error: any) {
    console.error('TOS return handling error:', error);
    return {
      error: `Failed to generate KYC link: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Step 3: Check customer KYC status
 */
export async function checkCustomerStatus(): Promise<{
  error?: string;
  kycStatus?: string;
  tosAccepted?: boolean;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant.sphereCustomerId) {
      return { error: 'Customer not found.' };
    }

    const sphereClient = createSphereClient();
    const status = await sphereClient.getCustomerStatus(user.merchant.sphereCustomerId);

    // Update local KYC status
    await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        kycStatus: status.kycStatus || 'pending',
      },
    });

    return {
      kycStatus: status.kycStatus,
      tosAccepted: status.tosAccepted,
    };
  } catch (error: any) {
    console.error('Status check error:', error);
    return {
      error: `Failed to check customer status: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Step 4: Add bank account (optional)
 */
const bankAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  currency: z.enum(['usd', 'eur', 'brl', 'cad', 'cop', 'idr', 'inr', 'mxn', 'php', 'sgd', 'thb', 'vnd', 'gbp']),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().min(1, 'Routing number is required'),
  accountType: z.enum(['checking', 'savings']),
  beneficiaryAddressLine1: z.string().min(1, 'Address line 1 is required'),
  beneficiaryAddressLine2: z.string().optional(),
  beneficiaryAddressCity: z.string().min(1, 'City is required'),
  beneficiaryAddressPostalCode: z.string().min(1, 'Postal code is required'),
  beneficiaryAddressState: z.string().min(1, 'State is required'),
  beneficiaryAddressCountry: z.string().length(2, 'Country code must be 2 characters'),
});

export async function addBankAccount(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: boolean; bankAccountId?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant.sphereCustomerId) {
      return { error: 'Customer not found. Please complete onboarding first.' };
    }

    const rawData = {
      accountName: formData.get('accountName') as string,
      bankName: formData.get('bankName') as string,
      accountHolderName: formData.get('accountHolderName') as string,
      currency: formData.get('currency') as string,
      accountNumber: formData.get('accountNumber') as string,
      routingNumber: formData.get('routingNumber') as string,
      accountType: formData.get('accountType') as string,
      beneficiaryAddressLine1: formData.get('beneficiaryAddressLine1') as string,
      beneficiaryAddressLine2: formData.get('beneficiaryAddressLine2') as string,
      beneficiaryAddressCity: formData.get('beneficiaryAddressCity') as string,
      beneficiaryAddressPostalCode: formData.get('beneficiaryAddressPostalCode') as string,
      beneficiaryAddressState: formData.get('beneficiaryAddressState') as string,
      beneficiaryAddressCountry: formData.get('beneficiaryAddressCountry') as string,
    };

    const parsed = bankAccountSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: 'Please fill in all required bank account fields correctly.' };
    }

    const data = parsed.data;

    try {
      const sphereClient = createSphereClient();

      const bankAccountParams: CreateSphereBankAccountParams = {
        accountName: data.accountName,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        currency: data.currency as any,
        accountDetails: {
          accountNumber: data.accountNumber,
          routingNumber: data.routingNumber,
          accountType: data.accountType as 'checking' | 'savings',
        },
        beneficiaryAddress: {
          line1: data.beneficiaryAddressLine1,
          line2: data.beneficiaryAddressLine2,
          city: data.beneficiaryAddressCity,
          postalCode: data.beneficiaryAddressPostalCode,
          state: data.beneficiaryAddressState,
          country: data.beneficiaryAddressCountry,
        },
      };

      const bankAccount = await sphereClient.registerBankAccount(
        user.merchant.sphereCustomerId,
        bankAccountParams
      );

      // Update merchant with bank account ID
      await prisma.merchant.update({
        where: { id: user.merchant.id },
        data: {
          sphereBankAccountId: bankAccount.id,
        },
      });

      return {
        success: true,
        bankAccountId: bankAccount.id,
      };
    } catch (sphereError: any) {
      console.error('Bank account registration error:', sphereError);
      return {
        error: `Failed to register bank account: ${sphereError.message || 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('Bank account error:', error);
    return {
      error: 'An error occurred while adding bank account. Please try again.',
    };
  }
}

/**
 * Skip bank account and complete onboarding
 */
export async function skipBankAccount(): Promise<void> {
  const user = await getCurrentUser();
  
  if (user?.merchant) {
    // Mark onboarding as completed even without bank account
    await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingSkippedAt: null, // Clear skip timestamp
      },
    });
  }
  
  redirect('/dashboard');
}

/**
 * Complete onboarding (after bank account added)
 */
export async function completeOnboarding(): Promise<void> {
  const user = await getCurrentUser();
  
  if (user?.merchant) {
    await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingSkippedAt: null, // Clear skip timestamp
      },
    });
  }
  
  redirect('/dashboard');
}

/**
 * Skip entire onboarding process
 * User can complete it later from dashboard
 */
export async function skipOnboarding(): Promise<void> {
  const user = await getCurrentUser();
  
  if (user?.merchant) {
    await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        onboardingSkippedAt: new Date(),
        onboardingCompleted: false,
      },
    });
  }
  
  redirect('/dashboard');
}
