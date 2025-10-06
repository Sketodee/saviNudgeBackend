import { Timestamp } from "firebase-admin/firestore";

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  profile_image_url: string | null;
  preferred_currency: string;
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