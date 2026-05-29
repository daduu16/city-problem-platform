import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { ScopeBuilderService } from './scope-builder.service';
import { ScopeCacheService } from './scope-cache.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  providers: [
    AccessControlService,
    ScopeBuilderService,
    ScopeCacheService,
    PermissionsGuard,
  ],
  exports: [AccessControlService, PermissionsGuard],
})
export class AccessControlModule {}
