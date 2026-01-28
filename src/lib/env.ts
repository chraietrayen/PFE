/**
 * Environment Configuration
 * Centralized environment variable validation and access
 */

import { z } from "zod";

// Environment schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default("3307").transform(Number),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  
  // Push notifications (optional)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_EMAIL: z.string().email().optional(),
  
  // AWS Rekognition (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  
  // App settings
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Parse and validate environment
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map(e => e.path.join('.')).join(', ');
      console.error(`❌ Missing or invalid environment variables: ${missing}`);
      
      // In development, log details; in production, throw
      if (process.env.NODE_ENV === 'development') {
        console.error('Validation errors:', error.issues);
      }
    }
    throw error;
  }
}

// Export validated environment
export const env = {
  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || '',
  },
  
  // NextAuth
  auth: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET || '',
  },
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  
  // Email
  email: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
    isConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  },
  
  // Push notifications
  push: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    email: process.env.VAPID_EMAIL,
    isConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  },
  
  // AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-1',
    isConfigured: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  },
  
  // App
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
};

/**
 * Check if all required environment variables are set
 */
export function checkRequiredEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Log environment status (for debugging)
 */
export function logEnvStatus() {
  console.log('🔧 Environment Configuration:');
  console.log(`   Node ENV: ${env.app.nodeEnv}`);
  console.log(`   Database: ${env.database.host}:${env.database.port}/${env.database.name}`);
  console.log(`   Auth URL: ${env.auth.url}`);
  console.log(`   Email: ${env.email.isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Push: ${env.push.isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   AWS: ${env.aws.isConfigured ? '✅ Configured' : '❌ Not configured'}`);
}
