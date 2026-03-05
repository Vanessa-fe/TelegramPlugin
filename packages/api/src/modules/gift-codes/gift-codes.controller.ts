import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import {
  createGiftCodeSchema,
  updateGiftCodeSchema,
  validateGiftCodeSchema,
} from './gift-codes.schema';
import type {
  CreateGiftCodeDto,
  UpdateGiftCodeDto,
  ValidateGiftCodeDto,
} from './gift-codes.schema';
import { GiftCodesService } from './gift-codes.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';

@Controller('admin/gift-codes')
export class GiftCodesController {
  constructor(private readonly giftCodesService: GiftCodesService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN)
  findAll() {
    return this.giftCodesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.giftCodesService.findOne(id);
  }

  @Get(':id/usages')
  @Roles(UserRole.SUPERADMIN)
  getUsages(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.giftCodesService.getUsages(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createGiftCodeSchema as never))
    body: CreateGiftCodeDto,
  ) {
    return this.giftCodesService.create(body, user.userId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateGiftCodeSchema)) body: UpdateGiftCodeDto,
  ) {
    return this.giftCodesService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  disable(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.giftCodesService.disable(id);
  }

  @Post('validate')
  @Public()
  validate(
    @Body(new ZodValidationPipe(validateGiftCodeSchema)) body: ValidateGiftCodeDto,
  ) {
    return this.giftCodesService.validate(body);
  }
}
