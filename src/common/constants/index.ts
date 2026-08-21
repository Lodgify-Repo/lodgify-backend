export const LOG_DIR = 'logs';
export const { 
  ENV, 
  DATABASE_URL, 
  PORT, 
  REDIS_DB, 
  REDIS_HOST, 
  REDIS_PASSWORD, 
  REDIS_PORT,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  PAYSTACK_SECRET_KEY,
  GOOGLE_MAPS_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GCS_BUCKET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  ALLOWED_ORIGINS,
} = process.env;

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

/** CORS origins parsed from ALLOWED_ORIGINS env (comma-separated), with localhost fallback */
export const allowedOrigins: string[] = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ORIGINS;

