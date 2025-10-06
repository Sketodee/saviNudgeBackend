// validators/userValidator.ts
import Joi from 'joi';
import { CreateUserDTO, ValidationError } from '../../types/appScopeTypes';



export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validatedData: CreateUserDTO | null;
}

/**
 * Joi schema for user creation DTO
 */
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(255)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required'
    }),

  password_hash: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),

  full_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .trim()
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters',
      'string.pattern.base': 'Full name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'Full name is required'
    }),

  phone_number: Joi.string()
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .trim()
    .custom((value, helpers) => {
      // Remove common formatting characters
      const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
      if (!/^\+?[1-9]\d{7,14}$/.test(cleaned)) {
        return helpers.error('any.invalid');
      }
      return cleaned;
    })
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Invalid phone number format. Must be 8-15 digits, optionally starting with +',
      'any.invalid': 'Invalid phone number format. Must be 8-15 digits, optionally starting with +',
      'any.required': 'Phone number is required'
    }),

  profile_image_url: Joi.string()
    .uri()
    .max(500)
    .pattern(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    .trim()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Invalid URL format for profile image',
      'string.max': 'Profile image URL must not exceed 500 characters',
      'string.pattern.base': 'Profile image URL must end with a valid image extension (.jpg, .jpeg, .png, .gif, .webp, .svg)'
    }),

  preferred_currency: Joi.string()
    .valid('NGN', 'USD')
    .uppercase()
    .trim()
    .required()
    .messages({
      'string.empty': 'Preferred currency is required',
      'any.only': 'Preferred currency must be either NGN or USD',
      'any.required': 'Preferred currency is required'
    })
});

/**
 * Validates user creation data
 * @param data - User data to validate
 * @returns Validation result with errors or validated data
 */
export const validateCreateUser = (data: any): ValidationResult => {
  const { error, value } = createUserSchema.validate(data, {
    abortEarly: false, // Collect all errors
    stripUnknown: true // Remove unknown fields
  });

  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      validatedData: null
    };
  }

  // Convert empty string to null for optional profile_image_url
  if (value.profile_image_url === '') {
    value.profile_image_url = null;
  }

  return {
    isValid: true,
    errors: [],
    validatedData: value as CreateUserDTO
  };
};