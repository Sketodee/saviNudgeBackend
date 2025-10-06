
import bcrypt from 'bcrypt';
import {
  createUser as createUserModel,
  findUserByEmail,
  findUserByPhoneNumber,
  findUserById,
  updateUserLastLogin,
  updateUser as updateUserModel,
  softDeleteUser as softDeleteUserModel,
} from '../model/UserModel';
import { CreateUserDTO, User, ValidationError } from '../types/appScopeTypes';
import { validateCreateUser } from '../config/validators/userValidator';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  errors: ValidationError[] | null;
  data: T | null;
}

export interface UserResponse extends Omit<User, 'password_hash'> {}


export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};


export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const createUser = async (userData: CreateUserDTO): Promise<ServiceResponse<UserResponse>> => {
  try {
    // Validate user data
    const validation = validateCreateUser(userData);
    
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        data: null
      };
    }

    const validatedData = validation.validatedData!;

    // Check if email already exists
    const existingUser = await findUserByEmail(validatedData.email);
    
    if (existingUser) {
      return {
        success: false,
        message: 'User already exists',
        errors: [{
          field: 'email',
          message: 'Email address is already registered'
        }],
        data: null
      };
    }

    // Check if phone number already exists
    const existingPhone = await findUserByPhoneNumber(validatedData.phone_number);
    
    if (existingPhone) {
      return {
        success: false,
        message: 'Phone number already exists',
        errors: [{
          field: 'phone_number',
          message: 'Phone number is already registered'
        }],
        data: null
      };
    }

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password_hash);

    // Prepare user data for creation
    const userToCreate = {
      email: validatedData.email,
      password_hash: hashedPassword,
      full_name: validatedData.full_name,
      phone_number: validatedData.phone_number,
      profile_image_url: validatedData.profile_image_url || null,
      preferred_currency: validatedData.preferred_currency
    };

    // Create user in database
    const createdUser = await createUserModel(userToCreate);

    // Remove password from response
    const { password_hash, ...userResponse } = createdUser;

    return {
      success: true,
      message: 'User created successfully',
      errors: null,
      data: userResponse as UserResponse
    };

  } catch (error: any) {
    console.error('Error in createUser service:', error);
    return {
      success: false,
      message: 'Internal server error',
      errors: [{
        field: 'general',
        message: error.message
      }],
      data: null
    };
  }
};


export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    return await findUserByEmail(email);
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};


export const getUserById = async (userId: string): Promise<UserResponse | null> => {
  try {
    const user = await findUserById(userId);
    
    if (user) {
      // Remove password from response
      const { password_hash, ...userResponse } = user;
      return userResponse as UserResponse;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};


export const updateLastLogin = async (userId: string): Promise<boolean> => {
  try {
    return await updateUserLastLogin(userId);
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
};

export const updateUser = async (
  userId: string,
  updateData: Partial<Omit<User, 'user_id' | 'password_hash' | 'date_registered'>>
): Promise<ServiceResponse<UserResponse>> => {
  try {
    // Check if user exists
    const existingUser = await findUserById(userId);
    
    if (!existingUser) {
      return {
        success: false,
        message: 'User not found',
        errors: [{
          field: 'userId',
          message: 'No user exists with the provided ID'
        }],
        data: null
      };
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const emailExists = await findUserByEmail(updateData.email);
      
      if (emailExists && emailExists.user_id !== userId) {
        return {
          success: false,
          message: 'Email already exists',
          errors: [{
            field: 'email',
            message: 'Email address is already registered to another user'
          }],
          data: null
        };
      }
    }

    // If phone number is being updated, check for duplicates
    if (updateData.phone_number) {
      const phoneExists = await findUserByPhoneNumber(updateData.phone_number);
      
      if (phoneExists && phoneExists.user_id !== userId) {
        return {
          success: false,
          message: 'Phone number already exists',
          errors: [{
            field: 'phone_number',
            message: 'Phone number is already registered to another user'
          }],
          data: null
        };
      }
    }

    // Update user
    const updatedUser = await updateUserModel(userId, updateData);
    
    if (!updatedUser) {
      return {
        success: false,
        message: 'Failed to update user',
        errors: [{
          field: 'general',
          message: 'An error occurred while updating the user'
        }],
        data: null
      };
    }

    // Remove password from response
    const { password_hash, ...userResponse } = updatedUser;

    return {
      success: true,
      message: 'User updated successfully',
      errors: null,
      data: userResponse as UserResponse
    };

  } catch (error: any) {
    console.error('Error in updateUser service:', error);
    return {
      success: false,
      message: 'Internal server error',
      errors: [{
        field: 'general',
        message: error.message
      }],
      data: null
    };
  }
};

export const softDeleteUser = async (userId: string): Promise<ServiceResponse<null>> => {
  try {
    // Check if user exists
    const existingUser = await findUserById(userId);
    
    if (!existingUser) {
      return {
        success: false,
        message: 'User not found',
        errors: [{
          field: 'userId',
          message: 'No user exists with the provided ID'
        }],
        data: null
      };
    }

    // Check if user is already deactivated
    if (!existingUser.is_active) {
      return {
        success: false,
        message: 'User already deactivated',
        errors: [{
          field: 'is_active',
          message: 'This user account is already deactivated'
        }],
        data: null
      };
    }

    // Soft delete user
    const success = await softDeleteUserModel(userId);
    
    if (!success) {
      return {
        success: false,
        message: 'Failed to deactivate user',
        errors: [{
          field: 'general',
          message: 'An error occurred while deactivating the user'
        }],
        data: null
      };
    }

    return {
      success: true,
      message: 'User deactivated successfully',
      errors: null,
      data: null
    };

  } catch (error: any) {
    console.error('Error in softDeleteUser service:', error);
    return {
      success: false,
      message: 'Internal server error',
      errors: [{
        field: 'general',
        message: error.message
      }],
      data: null
    };
  }
};