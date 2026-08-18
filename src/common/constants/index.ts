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
  GCS_BUCKET
} = process.env;

export const allowedOrigins: string[] = ['http://localhost:5173', 'http://localhost:3000'] as const;
