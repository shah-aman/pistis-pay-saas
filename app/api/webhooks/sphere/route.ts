import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { 
  verifyWebhookSignature, 
  validateWebhookTimestamp, 
  parseWebhookPayload 
} from '@/lib/sphere/webhooks';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-sphere-signature') || '';

    // Verify webhook signature
    const webhookSecret = process.env.SPHERE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('SPHERE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse and validate payload
    const payload = parseWebhookPayload(body);

    // Validate timestamp to prevent replay attacks
    if (!validateWebhookTimestamp(payload.timestamp)) {
      console.error('Webhook timestamp too old');
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 });
    }

    // Handle different event types
    switch (payload.event) {
      case 'payment.created':
        await handlePaymentCreated(payload.data);
        break;

      case 'payment.completed':
        await handlePaymentCompleted(payload.data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.data);
        break;

      case 'withdrawal.completed':
        await handleWithdrawalCompleted(payload.data);
        break;

      case 'withdrawal.failed':
        await handleWithdrawalFailed(payload.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${payload.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCreated(data: any) {
  // Payment already created when link was generated
  console.log('Payment created:', data.id);
}

async function handlePaymentCompleted(data: any) {
  await prisma.payment.update({
    where: { spherePaymentId: data.id },
    data: {
      status: 'completed',
      customerWallet: data.customerWallet,
      txSignature: data.txSignature,
      completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
    },
  });

  console.log('Payment completed:', data.id);
}

async function handlePaymentFailed(data: any) {
  await prisma.payment.update({
    where: { spherePaymentId: data.id },
    data: {
      status: 'failed',
    },
  });

  console.log('Payment failed:', data.id);
}

async function handleWithdrawalCompleted(data: any) {
  await prisma.withdrawal.update({
    where: { sphereWithdrawalId: data.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  console.log('Withdrawal completed:', data.id);
}

async function handleWithdrawalFailed(data: any) {
  await prisma.withdrawal.update({
    where: { sphereWithdrawalId: data.id },
    data: {
      status: 'failed',
    },
  });

  console.log('Withdrawal failed:', data.id);
}


