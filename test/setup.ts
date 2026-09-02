process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://avnadmin:AVNS_ZPilvzyC95olxemTqTW@pg-20d693fd-stem-festival.h.aivencloud.com:13217/defaultdb?sslmode=require";
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-api-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-api-secret';
process.env.LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY || 'test-locationiq-key';
