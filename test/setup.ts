process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://avnadmin:AVNS_ZPilvzyC95olxemTqTW@pg-20d693fd-stem-festival.h.aivencloud.com:13217/defaultdb?sslmode=require";
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.GCS_BUCKET = process.env.GCS_BUCKET || 'test-gcs-bucket';
