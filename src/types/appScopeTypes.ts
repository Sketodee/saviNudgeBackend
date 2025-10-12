import { Timestamp } from "firebase-admin/firestore";
import { UserRole } from "./enums";

export interface IAuditedEntity {
  created_by: string;
  created_on: Timestamp | Date;
  updated_by: string | null;
  updated_on: Timestamp | Date | null;
  deleted_by: string | null;
  deleted_on: Timestamp | Date | null;
  is_deleted: boolean;
}

export interface User extends IAuditedEntity {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  profile_image_url: string | null;
  preferred_currency: string;
  user_role: UserRole;
  date_registered: Timestamp | Date;
  last_login: Timestamp | Date | null;
  is_active: boolean;
  balance_visibility_default: boolean;
}

export interface CreateUserDTO {
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  profile_image_url?: string | null;
  preferred_currency: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  error: string | null;
  data: T | null;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  errors: ValidationError[] | null;
  data: T | null;
}