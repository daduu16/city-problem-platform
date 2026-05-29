import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AccessControlService } from '../access-control/access-control.service';
import { scopeToPayload } from '../access-control/access-scope.types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private accessControl: AccessControlService,
    private audit: AuditService,
    private prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
    });

    const scope = await this.accessControl.getScope(user.id);
    const geozones = await this.getGeozoneNames(scope.geozoneIds);

    const payload = { sub: user.id, email: user.email, roleId: user.roleId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleKey: user.role.key,
        roleName: user.role.name,
        department: user.department,
        organization: user.organization,
      },
      access: scopeToPayload(scope, geozones),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const scope = await this.accessControl.getScope(userId);
    const geozones = await this.getGeozoneNames(scope.geozoneIds);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleKey: user.role.key,
      roleName: user.role.name,
      department: user.department,
      phone: user.phone,
      organization: user.organization,
      access: scopeToPayload(scope, geozones),
    };
  }

  private async getGeozoneNames(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const zones = await this.prisma.geozone.findMany({
      where: { id: { in: ids } },
      select: { name: true },
    });
    return zones.map((z) => z.name);
  }
}
