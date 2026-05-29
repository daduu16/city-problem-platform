import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret-change-in-production'),
    });
  }

  async validate(payload: { sub: string; email: string; roleId: string }): Promise<JwtPayload> {
    const user = await this.usersService.findById(payload.sub);
    if (!user?.isActive) {
      throw new UnauthorizedException();
    }
    return {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleKey: user.role.key,
    };
  }
}
