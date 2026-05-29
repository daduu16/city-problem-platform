import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        organization: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        organization: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: { select: { id: true, key: true, name: true } },
        department: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
