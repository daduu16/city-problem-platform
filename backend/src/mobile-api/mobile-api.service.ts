import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AttachmentType,
  DistrictStatus,
  HistoryActionType,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { DistrictService, NARIMANOV_GEOZONE_ID } from '../geozones/district.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMobileProblemDto } from './dto/create-mobile-problem.dto';
import {
  ForgotPasswordDto,
  MobileLoginDto,
  ResendCodeDto,
  VerifyEmailDto,
} from './dto/mobile-auth.dto';
import { RegisterDto } from './dto/register.dto';
import {
  mobileCategoryLabels,
  mobileCategoryMap,
  mobilePriorityLabels,
  mobilePriorityMap,
  mobileStatusLabels,
} from './mobile-api.types';

const DEFAULT_LAT = 40.4093;
const DEFAULT_LNG = 49.8671;
const MOBILE_UPLOADS_DIR = join(process.cwd(), 'public', 'uploads', 'mobile');
const legacyMobileCategoryMap = {
  SU: 'utilities',
  QAZ: 'utilities',
  ISIQ: 'lighting',
  YOL: 'infrastructure',
  ZIBIL: 'sanitation',
  QEZA: 'infrastructure',
  TEBIET_HADISESI: 'weather_emergency',
  TEHLUKESIZLIK: 'parks',
} as const;

@Injectable()
export class MobileApiService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private districtService: DistrictService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.trim();
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: normalizedPhone }] },
    });
    if (exists) {
      throw new ConflictException('Bu e-poçt və ya telefon artıq qeydiyyatdan keçib');
    }

    const verificationCode = this.generateVerificationCode();
    const user = await this.prisma.user.create({
      data: {
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        finCode: dto.finCode.trim().toUpperCase(),
        passwordHash: await bcrypt.hash(dto.password, 10),
        emailVerified: false,
        verificationCode,
        verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        roleId: await this.ensureCitizenRoleId(),
      },
    });

    await this.sendVerificationEmail(normalizedEmail, verificationCode);

    return {
      token: this.signMobileToken(user.id, user.email),
      verificationCode,
      user: this.toMobileUser(user),
    };
  }

  async login(dto: MobileLoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-poçt/telefon və ya şifrə yanlışdır');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('Email təsdiqlənməyib. Zəhmət olmasa kodu təsdiqləyin.');
    }
    return {
      token: this.signMobileToken(user.id, user.email),
      user: this.toMobileUser(user),
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');
    if (!user.verificationCode || !user.verificationExpiresAt) {
      throw new BadRequestException('Təsdiq kodu mövcud deyil');
    }
    if (user.verificationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Təsdiq kodunun vaxtı bitib');
    }
    if (user.verificationCode !== dto.code.trim()) {
      throw new BadRequestException('Təsdiq kodu yanlışdır');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpiresAt: null,
      },
    });
    return { ok: true };
  }

  async resendCode(dto: ResendCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');

    const verificationCode = this.generateVerificationCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        emailVerified: false,
      },
    });
    await this.sendVerificationEmail(user.email, verificationCode);
    return { verificationCode };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
    });
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { ok: true, message: 'Şifrə uğurla yeniləndi' };
  }

  async findNews() {
    const items = await this.prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });
    return items.map((item) => ({
      ...item,
      imageUrl: this.resolvePublicAssetUrl(item.imageUrl),
    }));
  }

  findNotifications() {
    return this.prisma.mobileNotification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProblems() {
    const incidents = await this.prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.problemInclude(),
    });
    return incidents.map((incident) => this.toMobileProblem(incident));
  }

  private problemInclude() {
    return {
      category: true,
      attachments: { orderBy: { createdAt: 'asc' as const } },
      reports: {
        orderBy: { createdAt: 'asc' as const },
        select: { photoUrl: true, videoUrl: true },
      },
      _count: { select: { reports: true } },
    };
  }

  async createProblem(dto: CreateMobileProblemDto) {
    const reporter = await this.ensureDemoCitizen();
    const category = await this.ensureCategoryForMobileCode(dto.category);
    const priority = mobilePriorityMap[dto.priority] as IncidentPriority;
    const mediaUrl = dto.mediaUrl ?? dto.imageUrl;
    const attachmentType =
      dto.mediaType === 'video' ? AttachmentType.VIDEO : AttachmentType.PHOTO;
    const lat = dto.lat ?? DEFAULT_LAT;
    const lng = dto.lng ?? DEFAULT_LNG;
    const districtStatus = await this.districtService.resolveDistrictStatus(lat, lng);
    const geozoneId =
      districtStatus === DistrictStatus.WITHIN_DISTRICT
        ? NARIMANOV_GEOZONE_ID
        : null;

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        status: IncidentStatus.NEW,
        priority,
        type: IncidentType.COMPLAINT,
        categoryId: category.id,
        lat,
        lng,
        address: dto.address.trim(),
        districtStatus,
        geozoneId,
        createdById: reporter.id,
        attachments: mediaUrl
          ? {
              create: {
                fileUrl: mediaUrl,
                fileName: mediaUrl.split('/').pop(),
                type: attachmentType,
              },
            }
          : undefined,
        reports: {
          create: {
            reporterId: reporter.id,
            title: dto.title.trim(),
            message: dto.description.trim(),
            lat,
            lng,
            address: dto.address.trim(),
            photoUrl:
              mediaUrl && attachmentType === AttachmentType.PHOTO
                ? mediaUrl
                : undefined,
            videoUrl:
              mediaUrl && attachmentType === AttachmentType.VIDEO
                ? mediaUrl
                : undefined,
          },
        },
        history: {
          create: {
            actionType: HistoryActionType.CREATED,
            createdById: reporter.id,
            newValue: IncidentStatus.NEW,
          },
        },
      },
      include: this.problemInclude(),
    });

    return this.toMobileProblem(incident);
  }

  async uploadMobileMedia(
    file: Express.Multer.File,
    mediaType?: 'image' | 'video',
  ) {
    const detectedType = this.detectMediaType(file.mimetype);
    const normalizedType = mediaType ?? detectedType;
    if (!normalizedType) {
      throw new BadRequestException('Unsupported media type');
    }
    if (detectedType && mediaType && detectedType !== mediaType) {
      throw new BadRequestException('Uploaded file type does not match mediaType');
    }

    await mkdir(MOBILE_UPLOADS_DIR, { recursive: true });

    const ext =
      extname(file.originalname || '').toLowerCase() ||
      (normalizedType === 'video' ? '.mp4' : '.jpg');
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const fullPath = join(MOBILE_UPLOADS_DIR, fileName);
    await writeFile(fullPath, file.buffer);

    const publicPath = `/uploads/mobile/${fileName}`;
    return {
      mediaType: normalizedType,
      url: this.resolvePublicAssetUrl(publicPath),
    };
  }

  private async ensureCitizenRoleId() {
    const role = await this.prisma.role.upsert({
      where: { key: 'citizen' },
      update: { name: 'Citizen', incidentScope: 'ALL' },
      create: { key: 'citizen', name: 'Citizen', incidentScope: 'ALL' },
    });
    return role.id;
  }

  private async ensureDemoCitizen() {
    return this.prisma.user.upsert({
      where: { email: 'demo@cityproblem.local' },
      update: {},
      create: {
        name: 'Demo İstifadəçi',
        email: 'demo@cityproblem.local',
        phone: '0500000000',
        finCode: 'AA0AA00',
        passwordHash: await bcrypt.hash('demo12345', 10),
        emailVerified: true,
        roleId: await this.ensureCitizenRoleId(),
      },
    });
  }

  private async ensureCategoryForMobileCode(
    code: keyof typeof mobileCategoryMap | keyof typeof legacyMobileCategoryMap,
  ) {
    const key =
      (mobileCategoryMap as Record<string, string>)[code] ??
      legacyMobileCategoryMap[code as keyof typeof legacyMobileCategoryMap];
    if (!key) {
      throw new BadRequestException('Unknown mobile category code');
    }
    return this.prisma.category.upsert({
      where: { key },
      update: {},
      create: {
        key,
        name:
          (mobileCategoryLabels as Record<string, string>)[code] ??
          this.resolveCategoryNameByKey(key),
      },
    });
  }

  private toMobileProblem(
    incident: Prisma.IncidentGetPayload<{
      include: {
        category: true;
        attachments: true;
        reports: { select: { photoUrl: true; videoUrl: true } };
        _count: { select: { reports: true } };
      };
    }>,
  ) {
    const categoryCode = this.toMobileCategoryCode(incident.category.key);
    const priorityCode = this.toMobilePriorityCode(incident.priority);
    const statusCode = this.toMobileStatusCode(incident.status);
    const media = this.resolveIncidentMedia(incident);

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      address: incident.address ?? '',
      lat: incident.lat,
      lng: incident.lng,
      imageUrl: media.imageUrl,
      imageUrls: media.imageUrls,
      mediaItems: media.mediaItems,
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
      category: categoryCode,
      categoryLabel: mobileCategoryLabels[categoryCode],
      priority: priorityCode,
      priorityLabel: mobilePriorityLabels[priorityCode],
      status: statusCode,
      statusLabel: mobileStatusLabels[statusCode],
      createdAt: incident.createdAt,
      upvotes: incident._count.reports,
    };
  }

  private resolveIncidentMedia(incident: {
    attachments: Array<{ fileUrl: string; type: AttachmentType }>;
    reports?: Array<{ photoUrl: string | null; videoUrl: string | null }>;
  }) {
    const mediaItems: Array<{ uri: string; type: 'image' | 'video' }> = [];
    const seen = new Set<string>();

    const push = (url: string | null | undefined, type: 'image' | 'video') => {
      if (!url?.trim()) return;
      // Relative paths so mobile/web clients resolve with their own API host (not server localhost).
      const uri = this.toRelativeAssetPath(url.trim());
      const key = `${type}:${uri}`;
      if (seen.has(key)) return;
      seen.add(key);
      mediaItems.push({ uri, type });
    };

    for (const attachment of incident.attachments) {
      if (attachment.type === AttachmentType.VIDEO) {
        push(attachment.fileUrl, 'video');
      } else {
        push(attachment.fileUrl, 'image');
      }
    }

    for (const report of incident.reports ?? []) {
      push(report.videoUrl, 'video');
      push(report.photoUrl, 'image');
    }

    const first = mediaItems[0];
    const imageUrls = mediaItems
      .filter((m) => m.type === 'image')
      .map((m) => m.uri);

    return {
      mediaItems,
      imageUrl: imageUrls[0],
      imageUrls,
      mediaUrl: first?.uri,
      mediaType: first?.type,
    };
  }

  private toMobileUser(user: { id: string; name: string; email: string; phone: string | null; finCode: string | null }) {
    return {
      id: user.id,
      fullName: user.name,
      email: user.email,
      phone: user.phone ?? '',
      finCode: user.finCode ?? undefined,
    };
  }

  private signMobileToken(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email });
  }

  private generateVerificationCode() {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  /** Path served under static `/uploads` or `/news` (no host — client resolves). */
  private toRelativeAssetPath(url: string): string {
    const trimmed = url.trim();
    if (trimmed.startsWith('/')) return trimmed;
    try {
      const parsed = new URL(trimmed);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return trimmed.startsWith('uploads/') ? `/${trimmed}` : trimmed;
    }
  }

  private resolvePublicAssetUrl(url: string): string {
    const base =
      process.env.PUBLIC_API_URL?.replace(/\/$/, '') ??
      `http://localhost:${process.env.PORT ?? 3001}`;
    if (url.startsWith('/')) {
      return `${base}${url}`;
    }
    return url.replace(/:(4000)(?=\/|$)/, ':3001');
  }

  private detectMediaType(mimeType?: string): 'image' | 'video' | null {
    if (!mimeType) return null;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return null;
  }

  private async sendVerificationEmail(email: string, code: string) {
    console.log(`[MAIL MOCK] ${email} üçün təsdiq kodu: ${code}`);
  }

  private toMobileCategoryCode(key: string): keyof typeof mobileCategoryMap {
    const entry = Object.entries(mobileCategoryMap).find(([, value]) => value === key);
    return (entry?.[0] ?? 'INFRASTRUCTURE') as keyof typeof mobileCategoryMap;
  }

  private resolveCategoryNameByKey(key: string): string {
    const entry = Object.entries(mobileCategoryMap).find(([, value]) => value === key);
    if (!entry) return key;
    return mobileCategoryLabels[entry[0] as keyof typeof mobileCategoryMap];
  }

  private toMobilePriorityCode(priority: IncidentPriority): keyof typeof mobilePriorityMap {
    const entry = Object.entries(mobilePriorityMap).find(([, value]) => value === priority);
    return (entry?.[0] ?? 'ORTA') as keyof typeof mobilePriorityMap;
  }

  private toMobileStatusCode(status: IncidentStatus): keyof typeof mobileStatusLabels {
    if (status === IncidentStatus.NEW) return 'YENI';
    if (status === IncidentStatus.PENDING) return 'BAXILIR';
    if (status === IncidentStatus.RESOLVED || status === IncidentStatus.ARCHIVED) {
      return 'HELL_EDILDI';
    }
    return 'ICRADADIR';
  }
}
