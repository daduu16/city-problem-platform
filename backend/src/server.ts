import cors from 'cors';
import express from 'express';
import path from 'path';
import { z } from 'zod';

import { comparePassword, hashPassword, signToken } from './auth.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { sendVerificationEmail } from './mail.js';
import { AuthedRequest, requireAuth } from './middleware.js';
import {
  categoryMap,
  priorityMap,
  problemCategories,
  problemPriorities,
  problemStatuses,
  statusMap,
} from './types.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/news', express.static(path.resolve('public/news')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    finCode: z.string().min(7).max(7),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Məlumatlar düzgün deyil', errors: parsed.error.flatten() });
  }

  const { fullName, email, phone, finCode, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { phone: normalizedPhone }] },
  });
  if (exists) {
    return res.status(409).json({ message: 'Bu e-poçt və ya telefon artıq qeydiyyatdan keçib' });
  }

  const verificationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
  const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        finCode: finCode.toUpperCase(),
        passwordHash,
        emailVerified: false,
        verificationCode,
        verificationExpiresAt,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'Bu e-poçt və ya telefon artıq qeydiyyatdan keçib' });
    }
    throw error;
  }

  await sendVerificationEmail(normalizedEmail, verificationCode);
  const token = signToken(user.id, user.email);
  return res.status(201).json({
    token,
    verificationCode,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, finCode: user.finCode },
  });
});

app.post('/api/auth/verify-email', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Məlumatlar düzgün deyil' });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
  if (!user.verificationCode || !user.verificationExpiresAt) {
    return res.status(400).json({ message: 'Təsdiq kodu mövcud deyil' });
  }
  if (user.verificationExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Təsdiq kodunun vaxtı bitib' });
  }
  if (user.verificationCode !== parsed.data.code) {
    return res.status(400).json({ message: 'Təsdiq kodu yanlışdır' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationCode: null, verificationExpiresAt: null },
  });
  return res.json({ ok: true });
});

app.post('/api/auth/resend-code', async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Email düzgün deyil' });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

  const verificationCode = `${Math.floor(100000 + Math.random() * 900000)}`;
  const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode, verificationExpiresAt, emailVerified: false },
  });

  await sendVerificationEmail(user.email, verificationCode);
  return res.json({ verificationCode });
});

app.post('/api/auth/login', async (req, res) => {
  const schema = z.object({
    identifier: z.string().min(3),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Məlumatlar düzgün deyil', errors: parsed.error.flatten() });
  }

  const { identifier, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    },
  });
  if (!user) {
    return res.status(401).json({ message: 'E-poçt/telefon və ya şifrə yanlışdır' });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'E-poçt/telefon və ya şifrə yanlışdır' });
  }
  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Email təsdiqlənməyib. Zəhmət olmasa kodu təsdiqləyin.' });
  }

  const token = signToken(user.id, user.email);
  return res.json({
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, finCode: user.finCode },
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const schema = z.object({
    identifier: z.string().min(3),
    newPassword: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Məlumatlar düzgün deyil', errors: parsed.error.flatten() });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.data.identifier.toLowerCase() }, { phone: parsed.data.identifier }] },
  });
  if (!user) {
    return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return res.json({ ok: true, message: 'Şifrə uğurla yeniləndi' });
});

app.get('/api/news', async (_req, res) => {
  const news = await prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });
  res.json(news);
});

app.get('/api/notifications', async (_req, res) => {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(notifications);
});

app.get('/api/problems', async (_req, res) => {
  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, fullName: true } } },
  });

  res.json(
    problems.map((problem) => ({
      ...problem,
      categoryLabel: categoryMap[problem.category as keyof typeof categoryMap],
      priorityLabel: priorityMap[problem.priority as keyof typeof priorityMap],
      statusLabel: statusMap[problem.status as keyof typeof statusMap],
    })),
  );
});

app.get('/api/problems/my', requireAuth, async (req: AuthedRequest, res) => {
  const problems = await prisma.problem.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    problems.map((problem) => ({
      ...problem,
      categoryLabel: categoryMap[problem.category as keyof typeof categoryMap],
      priorityLabel: priorityMap[problem.priority as keyof typeof priorityMap],
      statusLabel: statusMap[problem.status as keyof typeof statusMap],
    })),
  );
});

app.post('/api/problems', async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    address: z.string().min(5),
    imageUrl: z.string().trim().optional().refine((value) => !value || value.length > 0, { message: 'Şəkil URL-i boş ola bilməz' }),
    category: z.enum(problemCategories),
    priority: z.enum(problemPriorities),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Məlumatlar düzgün deyil', errors: parsed.error.flatten() });
  }

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@cityproblem.local' },
    update: {},
    create: {
      fullName: 'Demo İstifadəçi',
      email: 'demo@cityproblem.local',
      phone: '0500000000',
      finCode: 'AA0AA00',
      passwordHash: await hashPassword('demo12345'),
      emailVerified: true,
    },
  });

  const created = await prisma.problem.create({
    data: {
      ...parsed.data,
      status: 'YENI',
      userId: demoUser.id,
    },
  });

  res.status(201).json({
    ...created,
    categoryLabel: categoryMap[created.category as keyof typeof categoryMap],
    priorityLabel: priorityMap[created.priority as keyof typeof priorityMap],
    statusLabel: statusMap[created.status as keyof typeof statusMap],
  });
});

app.patch('/api/problems/:id/status', async (req, res) => {
  const schema = z.object({ status: z.enum(problemStatuses) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Status düzgün deyil' });
  }

  const updated = await prisma.problem.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });

  res.json({
    ...updated,
    categoryLabel: categoryMap[updated.category as keyof typeof categoryMap],
    priorityLabel: priorityMap[updated.priority as keyof typeof priorityMap],
    statusLabel: statusMap[updated.status as keyof typeof statusMap],
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Daxili server xətası' });
});

app.listen(config.port, () => {
  console.log(`Backend işləyir: http://localhost:${config.port}`);
});
