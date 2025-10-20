// src/services/authService.ts
import { ServiceResponse, User } from "../types/appScopeTypes";
import { generateTokens, TokenResponse, verifyRefreshToken } from "../utils/jwt";
import { comparePassword, getUserByEmail, getUserById, updateLastLogin, hashPassword } from "./userService";
import { createPasswordResetOTP, verifyOTP, markOTPAsUsed } from "./otpService";
import { sendOTPEmail, sendPasswordChangedEmail } from "./emailService";
import { updateUser } from "../model/UserModel";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  tokens: TokenResponse;
}

export interface ChangePasswordInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

export async function login(input: LoginInput): Promise<ServiceResponse<AuthResponse>> {
  try {
    const user = await getUserByEmail(input.email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: [{ field: 'credentials', message: 'Invalid email or password' }],
        data: null,
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        message: 'Account is deactivated',
        errors: [{ field: 'account', message: 'Account is deactivated. Please contact support.' }],
        data: null,
      };
    }

    const isPasswordValid = await comparePassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: [{ field: 'credentials', message: 'Invalid email or password' }],
        data: null,
      };
    }

    await updateLastLogin(user.user_id);

    const tokens = generateTokens({
      user_id: user.user_id,
      email: user.email,
      user_role: user.user_role,
    });

    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      message: 'Login successful',
      errors: null,
      data: {
        user: userWithoutPassword,
        tokens,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred during login',
      errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Unknown error' }],
      data: null,
    };
  }
}

export async function refreshToken(refreshToken: string): Promise<ServiceResponse<TokenResponse>> {
  try {
    const payload = verifyRefreshToken(refreshToken);

    const user = await getUserById(payload.user_id);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errors: [{ field: 'user', message: 'User not found' }],
        data: null,
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        message: 'User account is inactive',
        errors: [{ field: 'user', message: 'User account is inactive' }],
        data: null,
      };
    }

    const tokens = generateTokens({
      user_id: user.user_id,
      email: user.email,
      user_role: user.user_role,
    });

    return {
      success: true,
      message: 'Token refreshed successfully',
      errors: null,
      data: tokens,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid refresh token',
      errors: [{ field: 'token', message: 'Invalid or expired refresh token' }],
      data: null,
    };
  }
}

/**
 * Change password for authenticated user
 */
export async function changePassword(input: ChangePasswordInput): Promise<ServiceResponse<null>> {
  try {
    // Validate input
    if (!input.oldPassword || !input.newPassword) {
      return {
        success: false,
        message: 'Old password and new password are required',
        errors: [{ field: 'password', message: 'Old password and new password are required' }],
        data: null,
      };
    }

    if (input.newPassword.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters long',
        errors: [{ field: 'newPassword', message: 'Password must be at least 8 characters long' }],
        data: null,
      };
    }

    if (input.oldPassword === input.newPassword) {
      return {
        success: false,
        message: 'New password must be different from old password',
        errors: [{ field: 'newPassword', message: 'New password must be different from old password' }],
        data: null,
      };
    }

    // Get user
    const user = await getUserById(input.userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errors: [{ field: 'user', message: 'User not found' }],
        data: null,
      };
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(input.oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      return {
        success: false,
        message: 'Incorrect old password',
        errors: [{ field: 'oldPassword', message: 'The old password you entered is incorrect' }],
        data: null,
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(input.newPassword);

    // Update password in database
    await updateUser(input.userId, { password_hash: newPasswordHash });

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.full_name);

    return {
      success: true,
      message: 'Password changed successfully',
      errors: null,
      data: null,
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      message: 'An error occurred while changing password',
      errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Unknown error' }],
      data: null,
    };
  }
}

/**
 * Request password reset OTP
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<ServiceResponse<null>> {
  try {
    if (!input.email) {
      return {
        success: false,
        message: 'Email is required',
        errors: [{ field: 'email', message: 'Email is required' }],
        data: null,
      };
    }

    // Check if user exists
    const user = await getUserByEmail(input.email);
    
    // For security reasons, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent',
        errors: null,
        data: null,
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        message: 'Account is deactivated',
        errors: [{ field: 'account', message: 'This account is deactivated. Please contact support.' }],
        data: null,
      };
    }

    // Generate OTP
    const otp = await createPasswordResetOTP(user.email);

    // Send OTP via email
    const emailSent = await sendOTPEmail(user.email, otp);

    if (!emailSent) {
      return {
        success: false,
        message: 'Failed to send OTP email',
        errors: [{ field: 'email', message: 'Failed to send OTP. Please try again.' }],
        data: null,
      };
    }

    return {
      success: true,
      message: 'Password reset OTP has been sent to your email',
      errors: null,
      data: null,
    };
  } catch (error) {
    console.error('Error in forgot password:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request',
      errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Unknown error' }],
      data: null,
    };
  }
}

/**
 * Reset password using OTP
 */
export async function resetPassword(input: ResetPasswordInput): Promise<ServiceResponse<null>> {
  try {
    // Validate input
    if (!input.email || !input.otp || !input.newPassword) {
      return {
        success: false,
        message: 'Email, OTP, and new password are required',
        errors: [{ field: 'input', message: 'All fields are required' }],
        data: null,
      };
    }

    if (input.newPassword.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters long',
        errors: [{ field: 'newPassword', message: 'Password must be at least 8 characters long' }],
        data: null,
      };
    }

    // Verify OTP
    const otpVerification = await verifyOTP(input.email, input.otp, 'password_reset');
    
    if (!otpVerification.valid) {
      return {
        success: false,
        message: otpVerification.message,
        errors: [{ field: 'otp', message: otpVerification.message }],
        data: null,
      };
    }

    // Get user
    const user = await getUserByEmail(input.email);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errors: [{ field: 'email', message: 'No account found with this email' }],
        data: null,
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(input.newPassword);

    // Update password
    await updateUser(user.user_id, { password_hash: newPasswordHash });

    // Mark OTP as used
    await markOTPAsUsed(input.email, input.otp, 'password_reset');

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.full_name);

    return {
      success: true,
      message: 'Password reset successfully',
      errors: null,
      data: null,
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'An error occurred while resetting password',
      errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Unknown error' }],
      data: null,
    };
  }
}