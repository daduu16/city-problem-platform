import { API_BASE_URL } from '@/services/api';

type RegisterInput = {
  fullName: string;
  email: string;
  phone: string;
  finCode: string;
  password: string;
  confirmPassword: string;
};

async function authFetch<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Server xətası');
  }
  return json as T;
}

export async function login(identifier: string, password: string) {
  if (!identifier.trim()) throw new Error('E-poçt və ya telefon daxil edin');
  if (password.length < 3) throw new Error('Şifrə ən az 3 simvol olmalıdır');
  return authFetch<{ token: string; user: { id: string; fullName: string; email: string; phone: string; finCode?: string } }>(
    '/api/auth/login',
    { identifier: identifier.trim(), password },
  );
}

export async function signup(input: RegisterInput) {
  if (input.password !== input.confirmPassword) {
    throw new Error('Təsdiq parolu eyni olmalıdır');
  }
  return authFetch<{ verificationCode: string; user: { email: string } }>('/api/auth/register', {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    finCode: input.finCode.trim().toUpperCase(),
    password: input.password,
  });
}

export async function verifySignupCode(email: string, code: string) {
  return authFetch<{ ok: boolean }>('/api/auth/verify-email', {
    email: email.trim().toLowerCase(),
    code: code.trim(),
  });
}

export async function resendSignupCode(email: string) {
  const response = await authFetch<{ verificationCode: string }>('/api/auth/resend-code', {
    email: email.trim().toLowerCase(),
  });
  return response.verificationCode;
}

export async function forgotPassword(identifier: string, newPassword: string, confirmPassword: string) {
  if (newPassword !== confirmPassword) throw new Error('Təsdiq parolu eyni olmalıdır');
  return authFetch<{ ok: boolean; message: string }>('/api/auth/forgot-password', {
    identifier: identifier.trim(),
    newPassword,
  });
}
