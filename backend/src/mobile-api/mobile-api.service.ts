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
  HistoryActionType,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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

@Injectable()
export class MobileApiService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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

  findNews() {
    return this.prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });
  }

  findNotifications() {
    return this.prisma.mobileNotification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProblems() {
    const incidents = await this.prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        attachments: true,
        _count: { select: { reports: true } },
      },
    });
    return incidents.map((incident) => this.toMobileProblem(incident));
  }

  async createProblem(dto: CreateMobileProblemDto) {
    const reporter = await this.ensureDemoCitizen();
    const category = await this.ensureCategoryForMobileCode(dto.category);
    const priority = mobilePriorityMap[dto.priority] as IncidentPriority;
    const mediaUrl = dto.mediaUrl ?? dto.imageUrl;
    const attachmentType =
      dto.mediaType === 'video' ? AttachmentType.VIDEO : AttachmentType.PHOTO;

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        status: IncidentStatus.NEW,
        priority,
        type: IncidentType.COMPLAINT,
        categoryId: category.id,
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        address: dto.address.trim(),
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
        history: {
          create: {
            actionType: HistoryActionType.CREATED,
            createdById: reporter.id,
            newValue: IncidentStatus.NEW,
          },
        },
      },
      include: {
        category: true,
        attachments: true,
        _count: { select: { reports: true } },
      },
    });

    return this.toMobileProblem(incident);
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

  private async ensureCategoryForMobileCode(code: keyof typeof mobileCategoryMap) {
    const key = mobileCategoryMap[code];
    return this.prisma.category.upsert({
      where: { key },
      update: {},
      create: { key, name: mobileCategoryLabels[code] },
    });
  }

  private toMobileProblem(
    incident: Prisma.IncidentGetPayload<{
      include: {
        category: true;
        attachments: true;
        _count: { select: { reports: true } };
      };
    }>,
  ) {
    const categoryCode = this.toMobileCategoryCode(incident.category.key);
    const priorityCode = this.toMobilePriorityCode(incident.priority);
    const statusCode = this.toMobileStatusCode(incident.status);
    const media = incident.attachments[0];

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      address: incident.address ?? '',
      imageUrl: media?.type === AttachmentType.PHOTO ? media.fileUrl : undefined,
      mediaUrl: media?.fileUrl,
      mediaType: media?.type === AttachmentType.VIDEO ? 'video' : media ? 'image' : undefined,
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

  private async sendVerificationEmail(email: string, code: string) {
    console.log(`[MAIL MOCK] ${email} üçün təsdiq kodu: ${code}`);
  }

  private toMobileCategoryCode(key: string): keyof typeof mobileCategoryMap {
    const entry = Object.entries(mobileCategoryMap).find(([, value]) => value === key);
    return (entry?.[0] ?? 'TEHLUKESIZLIK') as keyof typeof mobileCategoryMap;
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
