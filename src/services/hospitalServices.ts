import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client instance
let globalPrisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!globalPrisma) {
    globalPrisma = new PrismaClient();
  }
  return globalPrisma;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Utility to sanitize user object by removing sensitive fields
export function sanitizeUserObject<T extends { passwordHash?: string; salt?: string }>(user: T): Omit<T, 'passwordHash' | 'salt'> {
  const { passwordHash, salt, ...sanitized } = user;
  return sanitized;
}

// Helper validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Accepts standard international/US/national phone formats
  return phone.trim().length >= 7;
}

export function validateRequiredFields(data: Record<string, any>, requiredKeys: string[]) {
  const missing = requiredKeys.filter(key => data[key] === undefined || data[key] === null || data[key] === '');
  if (missing.length > 0) {
    throw new ValidationError(`Missing required field(s): ${missing.join(', ')}`);
  }
}
