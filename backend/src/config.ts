import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'city-problem-super-secret',
  mailHost: process.env.MAIL_HOST ?? 'smtp.gmail.com',
  mailPort: Number(process.env.MAIL_PORT ?? 587),
  mailSecure: String(process.env.MAIL_SECURE ?? 'false') === 'true',
  mailUser: process.env.MAIL_USER ?? '',
  mailPass: process.env.MAIL_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? process.env.MAIL_USER ?? '',
};
