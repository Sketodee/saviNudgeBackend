import { ServiceResponse, User } from "../types/appScopeTypes";
import { generateTokens, TokenResponse, verifyRefreshToken } from "../utils/jwt";
import { comparePassword, getUserByEmail, getUserById, updateLastLogin } from "./userService";


export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  tokens: TokenResponse;
}

export async function login(input: LoginInput): Promise<ServiceResponse<AuthResponse>> {
  try {
    // Find user by email
    const user = await getUserByEmail(input.email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: [{ field: 'credentials', message: 'Invalid email or password' }],
        data: null,
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        message: 'Account is deactivated',
        errors: [{ field: 'account', message: 'Account is deactivated. Please contact support.' }],
        data: null,
      };
    }

    // Verify password
    const isPasswordValid = await comparePassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: [{ field: 'credentials', message: 'Invalid email or password' }],
        data: null,
      };
    }

    // Update last login
    await updateLastLogin(user.user_id);

    // Generate tokens
    const tokens = generateTokens({
      user_id: user.user_id,
      email: user.email,
      user_role: user.user_role,
    });

    // Remove password hash from response
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
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get user to ensure they still exist and are active
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

    // Generate new tokens
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