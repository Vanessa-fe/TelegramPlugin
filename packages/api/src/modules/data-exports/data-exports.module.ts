import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DataExportsController } from './data-exports.controller';
import { DataExportsService } from './data-exports.service';

@Module({
  imports: [PrismaModule, AuditLogModule, ConfigModule],
  controllers: [DataExportsController],
  providers: [DataExportsService],
  exports: [DataExportsService],
})
export class DataExportsModule {}
