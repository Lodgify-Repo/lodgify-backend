import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables.
 * Required variables will cause a startup failure if missing.
 * Optional variables have sensible defaults for local development.
 */
export const envValidationSchema = Joi.object({
  // ─── Core ───────────────────────────────────────────────
  ENV: Joi.string().valid('dev', 'staging', 'production', 'test').default('dev'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required. Example: postgresql://user:password@localhost:5432/lodgify?schema=public',
  }),

  // ─── Redis ──────────────────────────────────────────────
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_DB: Joi.number().default(0),

  // ─── Authentication ─────────────────────────────────────
  JWT_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_SECRET is required for authentication to function.',
  }),
  JWT_REFRESH_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_REFRESH_SECRET is required for token refresh to function.',
  }),

  // ─── Third-Party: Paystack ──────────────────────────────
  PAYSTACK_SECRET_KEY: Joi.string().optional().allow(''),

  // ─── Third-Party: Google ────────────────────────────────
  GOOGLE_MAPS_KEY: Joi.string().optional().allow(''),
  GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),
  GCS_BUCKET: Joi.string().optional().allow(''),

  // ─── SMTP (Email) ──────────────────────────────────────
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().optional().allow(''),

  // ─── CORS ───────────────────────────────────────────────
  ALLOWED_ORIGINS: Joi.string().optional().allow('').default('http://localhost:5173,http://localhost:3000'),
}).options({ allowUnknown: true }); // Allow other env vars not listed here (e.g., PATH, HOME)
