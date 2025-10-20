// src/services/otpService.ts
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const otpCollection = db.collection('otp_codes');

export interface OTPRecord {
  email: string;
  otp: string;
  purpose: 'password_reset' | 'email_verification';
  created_at: FirebaseFirestore.Timestamp;
  expires_at: FirebaseFirestore.Timestamp;
  attempts: number;
  is_used: boolean;
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store OTP for password reset
 */
export async function createPasswordResetOTP(email: string): Promise<string> {
  const otp = generateOTP();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing unused OTPs for this email and purpose
  await deleteExistingOTPs(email, 'password_reset');

  // Create new OTP record
  await otpCollection.add({
    email: email.toLowerCase(),
    otp,
    purpose: 'password_reset',
    created_at: FieldValue.serverTimestamp(),
    expires_at: expiresAt,
    attempts: 0,
    is_used: false,
  });

  return otp;
}

/**
 * Delete existing unused OTPs for a user
 */
async function deleteExistingOTPs(email: string, purpose: 'password_reset' | 'email_verification'): Promise<void> {
  const snapshot = await otpCollection
    .where('email', '==', email.toLowerCase())
    .where('purpose', '==', purpose)
    .where('is_used', '==', false)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  email: string,
  otp: string,
  purpose: 'password_reset' | 'email_verification'
): Promise<{ valid: boolean; message: string }> {
  try {
    const snapshot = await otpCollection
      .where('email', '==', email.toLowerCase())
      .where('otp', '==', otp)
      .where('purpose', '==', purpose)
      .where('is_used', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, message: 'Invalid OTP' };
    }

    const doc : any = snapshot.docs[0];
    const data = doc.data() as OTPRecord;

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = data.expires_at.toDate();

    if (now > expiresAt) {
      // Delete expired OTP
      await doc.ref.delete();
      return { valid: false, message: 'OTP has expired' };
    }

    // Check attempt limit (max 5 attempts)
    if (data.attempts >= 5) {
      await doc.ref.delete();
      return { valid: false, message: 'Too many attempts. Please request a new OTP' };
    }

    // Increment attempts
    await doc.ref.update({
      attempts: FieldValue.increment(1),
    });

    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { valid: false, message: 'An error occurred while verifying OTP' };
  }
}

/**
 * Mark OTP as used after successful password reset
 */
export async function markOTPAsUsed(email: string, otp: string, purpose: 'password_reset' | 'email_verification'): Promise<void> {
  try {
    const snapshot = await otpCollection
      .where('email', '==', email.toLowerCase())
      .where('otp', '==', otp)
      .where('purpose', '==', purpose)
      .where('is_used', '==', false)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      if (doc) {
        await doc.ref.update({
          is_used: true,
        });
      }
    }
  } catch (error) {
    console.error('Error marking OTP as used:', error);
  }
}

/**
 * Clean up expired OTPs (should be run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const now = new Date();
    const snapshot = await otpCollection
      .where('expires_at', '<', now)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
}