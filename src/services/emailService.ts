// src/services/emailService.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email using nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Your App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string, expiryMinutes: number = 10): Promise<boolean> {
  const subject = 'Password Reset OTP';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .otp-box { background-color: #fff; padding: 20px; text-align: center; font-size: 32px; 
                   font-weight: bold; letter-spacing: 8px; border: 2px dashed #4CAF50; 
                   margin: 20px 0; border-radius: 5px; }
        .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have requested to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
          
          <div class="otp-box">${otp}</div>
          
          <p>This OTP is valid for <strong>${expiryMinutes} minutes</strong>.</p>
          
          <p class="warning">
            ⚠️ If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.
          </p>
          
          <p>For security reasons, never share this OTP with anyone.</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset OTP
    
    You have requested to reset your password. Your OTP is: ${otp}
    
    This OTP is valid for ${expiryMinutes} minutes.
    
    If you did not request a password reset, please ignore this email.
  `;

  return await sendEmail({ to: email, subject, html, text });
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Password Changed Successfully';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .success-icon { font-size: 48px; text-align: center; color: #4CAF50; margin: 20px 0; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; 
                   padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Changed</h1>
        </div>
        <div class="content">
          <div class="success-icon">✓</div>
          <p>Hello ${name},</p>
          <p>Your password has been successfully changed.</p>
          
          <div class="warning">
            <strong>⚠️ Did you make this change?</strong>
            <p>If you did not change your password, please contact our support team immediately 
               and secure your account.</p>
          </div>
          
          <p>For your security, we recommend:</p>
          <ul>
            <li>Using a strong, unique password</li>
            <li>Enabling two-factor authentication if available</li>
            <li>Not sharing your password with anyone</li>
          </ul>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Changed Successfully
    
    Hello ${name},
    
    Your password has been successfully changed.
    
    If you did not make this change, please contact support immediately.
  `;

  return await sendEmail({ to: email, subject, html, text });
}