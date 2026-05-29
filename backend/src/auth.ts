import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { config } from './config.js';

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as { sub: string; email: string };
}

