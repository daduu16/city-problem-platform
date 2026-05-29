import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserAccessScope } from '../../access-control/access-scope.types';

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
  roleKey: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const AccessScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserAccessScope | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.accessScope;
  },
);
