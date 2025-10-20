// src/utils/jwt.util.ts
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms"; 

export interface JWTPayload {
  user_id: string;
  email: string;
  user_role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = (process.env.JWT_SECRET || "fallback-secret-change-me") as Secret;
const REFRESH_TOKEN_SECRET = (process.env.REFRESH_TOKEN_SECRET || "refresh-secret-change-me") as Secret;

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as StringValue;
const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN || "30d") as StringValue;


export function generateAccessToken(payload: JWTPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function generateRefreshToken(payload: JWTPayload): string {
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES_IN };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
}

export function generateTokens(payload: JWTPayload): TokenResponse {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}


export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}


export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
