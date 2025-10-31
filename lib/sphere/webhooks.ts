import crypto from 'crypto';
import { SphereWebhookPayload } from '@/types/sphere';

/**
 * Verify Sphere webhook signature using HMAC SHA-256
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');
    
    return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Validate webhook timestamp to prevent replay attacks
 * Rejects webhooks older than 5 minutes
 */
export function validateWebhookTimestamp(timestamp: string): boolean {
  const webhookTime = new Date(timestamp).getTime();
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return Math.abs(currentTime - webhookTime) < fiveMinutes;
}

/**
 * Parse and validate Sphere webhook payload
 */
export function parseWebhookPayload(body: string): SphereWebhookPayload {
  try {
    const payload = JSON.parse(body) as SphereWebhookPayload;
    
    if (!payload.event || !payload.data || !payload.timestamp) {
      throw new Error('Invalid webhook payload structure');
    }

    return payload;
  } catch (error) {
    throw new Error('Failed to parse webhook payload');
  }
}


