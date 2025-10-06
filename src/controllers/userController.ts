
import { Request, Response } from 'express';
import {
  createUser as createUserService,
  getUserByEmail as getUserByEmailService,
  getUserById as getUserByIdService,
  updateLastLogin as updateLastLoginService,
  updateUser as updateUserService,
  softDeleteUser as softDeleteUserService
} from '../services/userService';
import { ApiResponse } from '../types/appScopeTypes';




export const createUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const {
      email,
      password_hash,
      full_name,
      phone_number,
      profile_image_url,
      preferred_currency
    } = req.body;

    console.log('Creating user with email:', email);

    // Call service to create user
    const result = await createUserService({
      email,
      password_hash,
      full_name,
      phone_number,
      profile_image_url,
      preferred_currency
    });

    // Handle validation errors
    if (!result.success && result.errors) {
      const errorMessages = result.errors.map(err => err.message).join(', ');
      
      res.status(400).json({
        success: false,
        message: result.message,
        error: errorMessages,
        data: null
      });
      return;
    }

    // Handle other errors (like email already exists)
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Unknown error',
        data: null
      });
      return;
    }

    // Success response
    res.status(201).json({
      success: true,
      message: result.message,
      error: null,
      data: result.data
    });

  } catch (error: any) {
    console.error('Error in createUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};


export const getUserById = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await getUserByIdService(userId!);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'No user exists with the provided ID',
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      error: null,
      data: user
    });

  } catch (error: any) {
    console.error('Error in getUserById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};


export const getUserByEmail = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'Please provide an email address',
        data: null
      });
      return;
    }

    const user = await getUserByEmailService(email);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'No user exists with the provided email',
        data: null
      });
      return;
    }

    // Remove password from response
    const { password_hash, ...userResponse } = user;

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      error: null,
      data: userResponse
    });

  } catch (error: any) {
    console.error('Error in getUserByEmail controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};

export const updateLastLogin = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { userId } = req.params;

    const success = await updateLastLoginService(userId!);

    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to update last login',
        error: 'Could not update the last login timestamp',
        data: null
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Last login updated successfully',
      error: null,
      data: null
    });

  } catch (error: any) {
    console.error('Error in updateLastLogin controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};


export const updateUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.user_id;
    delete updateData.password_hash;
    delete updateData.date_registered;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'Please provide at least one field to update',
        data: null
      });
      return;
    }

    const result = await updateUserService(userId!, updateData);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Failed to update user',
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
    console.error('Error in updateUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};


export const softDeleteUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { userId } = req.params;

    const result = await softDeleteUserService(userId!);

    if (!result.success) {
      const statusCode = result.message === 'User not found' ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: result.message,
        error: result.errors?.[0]?.message || 'Failed to deactivate user',
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
    console.error('Error in softDeleteUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      data: null
    });
  }
};
