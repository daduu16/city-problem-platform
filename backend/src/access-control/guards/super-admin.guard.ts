import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AccessControlService } from '../access-control.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private accessControl: AccessControlService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    if (!userId) return false;

    const scope = await this.accessControl.getScope(userId);
    request.accessScope = scope;

    if (!this.accessControl.isSuperAdmin(scope)) {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
