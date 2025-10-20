// src/controllers/authController.ts
import { Request, Response } from "express";
import { ApiResponse } from "../types/appScopeTypes";
import { 
  login as loginService,
  changePassword as changePasswordService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  refreshToken as refreshTokenService
} from "../services/authService";

/**
 * Login controller
 */
export const login = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Email and password are required',
        data: null
      });
      return;
    }

    const result = await loginService({ email, password });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Unknown error',
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      error: null,
      data: result.data
    });

  } catch (error: any) {
    console.error('Error in login controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'Please provide a refresh token',
        data: null
      });
      return;
    }

    const result = await refreshTokenService(refreshToken);

    if (!result.success) {
      res.status(401).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Invalid refresh token',
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      error: null,
      data: result.data
    });

  } catch (error: any) {
    console.error('Error in refreshToken controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

/**
 * Change password controller - for authenticated users
 */
export const changePassword = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Ensure user is authenticated (req.user is set by verifyJWT middleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'You must be logged in to change your password',
        data: null
      });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Old password and new password are required',
        error: 'Both old and new passwords must be provided',
        data: null
      });
      return;
    }

    const result = await changePasswordService({
      userId: req.user.user_id,
      oldPassword,
      newPassword,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Failed to change password',
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      error: null,
      data: null
    });

  } catch (error: any) {
    console.error('Error in changePassword controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

/**
 * Forgot password controller - Request OTP
 */
export const forgotPassword = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'Please provide your email address',
        data: null
      });
      return;
    }

    const result = await forgotPasswordService({ email });

    // Always return 200 for security (prevent email enumeration)
    res.status(200).json({
      success: result.success,
      message: result.message,
      error: result.success ? null : result.errors?.[0]?.message || null,
      data: null
    });

  } catch (error: any) {
    console.error('Error in forgotPassword controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

/**
 * Verify OTP controller - Optional endpoint to verify OTP before password reset
 */
export const verifyOTP = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
        error: 'Please provide both email and OTP',
        data: null
      });
      return;
    }

    // Import verifyOTP from otpService
    const { verifyOTP: verifyOTPService } = await import('../services/otpService');
    const result = await verifyOTPService(email, otp, 'password_reset');

    if (!result.valid) {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message,
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      error: null,
      data: { verified: true }
    });

  } catch (error: any) {
    console.error('Error in verifyOTP controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

/**
 * Reset password controller - Verify OTP and reset password
 */
export const resetPassword = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
        error: 'All fields are required',
        data: null
      });
      return;
    }

    const result = await resetPasswordService({ email, otp, newPassword });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Failed to reset password',
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      error: null,
      data: null
    });

  } catch (error: any) {
    console.error('Error in resetPassword controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

/**
 * Logout controller - Optional: for token invalidation
 */
export const logout = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the tokens from storage
    // However, you can implement token blacklisting here if needed
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      error: null,
      data: null
    });

  } catch (error: any) {
    console.error('Error in logout controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};