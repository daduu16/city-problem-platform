import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { ScopeBuilderService } from './scope-builder.service';
import { ScopeCacheService } from './scope-cache.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Global()
@Module({
  providers: [
    AccessControlService,
    ScopeBuilderService,
    ScopeCacheService,
    PermissionsGuard,
    SuperAdminGuard,
  ],
  exports: [AccessControlService, PermissionsGuard, SuperAdminGuard],
})
export class AccessControlModule {}
