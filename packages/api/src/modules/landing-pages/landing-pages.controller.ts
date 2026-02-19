import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import {
  createLandingPageSchema,
  updateLandingPageSchema,
  createElementSchema,
  updateElementSchema,
  bulkUpdateElementsSchema,
  reorderElementsSchema,
  updateSocialLinksSchema,
  updatePageSlugSchema,
} from './landing-pages.schema';
import type {
  CreateLandingPageDto,
  UpdateLandingPageDto,
  CreateElementDto,
  UpdateElementDto,
  BulkUpdateElementsDto,
  ReorderElementsDto,
  UpdateSocialLinksDto,
  UpdatePageSlugDto,
} from './landing-pages.schema';
import { LandingPagesService } from './landing-pages.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('landing-pages')
export class LandingPagesController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  @Get('me')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  getMyLandingPage(@CurrentUser() user: AuthUser) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.findByOrganization(organizationId);
  }

  @Get('me/slug')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  getMyPageSlug(@CurrentUser() user: AuthUser) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.getOrganizationSlug(organizationId);
  }

  @Patch('me/slug')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  updatePageSlug(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updatePageSlugSchema))
    body: UpdatePageSlugDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.updatePageSlug(organizationId, body);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  createLandingPage(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createLandingPageSchema))
    body: CreateLandingPageDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.create(organizationId, body);
  }

  @Patch('me')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  updateLandingPage(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateLandingPageSchema))
    body: UpdateLandingPageDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.update(organizationId, body);
  }

  @Post('me/publish')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  publishLandingPage(@CurrentUser() user: AuthUser) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.publish(organizationId);
  }

  @Post('me/unpublish')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  unpublishLandingPage(@CurrentUser() user: AuthUser) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.unpublish(organizationId);
  }

  // Elements endpoints
  @Put('me/elements')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  bulkUpdateElements(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(bulkUpdateElementsSchema))
    body: BulkUpdateElementsDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.bulkUpdateElements(organizationId, body);
  }

  @Post('me/elements')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  addElement(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createElementSchema)) body: CreateElementDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.addElement(organizationId, body);
  }

  @Patch('me/elements/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  updateElement(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateElementSchema)) body: UpdateElementDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.updateElement(organizationId, id, body);
  }

  @Delete('me/elements/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  deleteElement(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.deleteElement(organizationId, id);
  }

  @Put('me/elements/reorder')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  reorderElements(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(reorderElementsSchema))
    body: ReorderElementsDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.reorderElements(organizationId, body);
  }

  // Social links endpoint
  @Put('me/social-links')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  updateSocialLinks(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateSocialLinksSchema))
    body: UpdateSocialLinksDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.landingPagesService.updateSocialLinks(organizationId, body);
  }
}
