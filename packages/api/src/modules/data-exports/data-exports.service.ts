import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditActorType } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const SLA_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DataExportsService {
  private readonly logger = new Logger(DataExportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  async requestExport(organizationId: string, requestedById?: string | null) {
    const now = new Date();
    const slaDueAt = new Date(now.getTime() + SLA_DAYS * DAY_IN_MS);

    return this.prisma.dataExport.create({
      data: {
        organizationId,
        requestedById: requestedById ?? null,
        status: 'PENDING',
        requestedAt: now,
        slaDueAt,
      },
    });
  }

  findAll(organizationId?: string) {
    return this.prisma.dataExport.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { requestedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.dataExport.findUniqueOrThrow({
      where: { id },
    });
  }

  async processPendingExports(): Promise<void> {
    const pending = await this.prisma.dataExport.findMany({
      where: { status: 'PENDING' },
      orderBy: { requestedAt: 'asc' },
    });

    for (const exportJob of pending) {
      await this.processExport(exportJob.id);
    }
  }

  async processExport(exportId: string): Promise<void> {
    const exportJob = await this.prisma.dataExport.findUnique({
      where: { id: exportId },
    });

    if (!exportJob) {
      this.logger.warn(`Data export ${exportId} not found`);
      return;
    }

    if (exportJob.status !== 'PENDING') {
      return;
    }

    await this.prisma.dataExport.update({
      where: { id: exportId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: exportJob.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          billingEmail: true,
          stripeAccountId: true,
          saasActive: true,
          timezone: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          users: {
            select: {
              id: true,
              email: true,
              role: true,
              firstName: true,
              lastName: true,
              isActive: true,
              lastLoginAt: true,
              organizationId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          customers: true,
          products: {
            include: {
              plans: true,
              channels: {
                include: {
                  channel: true,
                },
              },
            },
          },
          channels: {
            include: {
              invites: true,
            },
          },
          subscriptions: {
            include: {
              plan: true,
              customer: true,
              entitlements: true,
              channelAccesses: true,
            },
          },
          paymentEvents: {
            select: {
              id: true,
              organizationId: true,
              subscriptionId: true,
              provider: true,
              type: true,
              externalId: true,
              occurredAt: true,
              processedAt: true,
              createdAt: true,
            },
            orderBy: { occurredAt: 'desc' },
          },
          auditLogs: true,
        },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const exportedAt = new Date();
      const payload = {
        exportedAt: exportedAt.toISOString(),
        organization,
      };
      const archivePath = await this.writeArchive(exportId, payload);
      const slaMet = exportJob.slaDueAt
        ? exportedAt <= exportJob.slaDueAt
        : null;

      await this.prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          archivePath,
          completedAt: exportedAt,
          slaMet,
        },
      });

      await this.auditLog.create({
        organizationId: exportJob.organizationId,
        actorType: AuditActorType.SYSTEM,
        action: 'rgpd.export.completed',
        resourceType: 'data_export',
        resourceId: exportId,
        correlationId: exportId,
        metadata: {
          archivePath,
          slaMet,
          requestedById: exportJob.requestedById ?? null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'FAILED',
          errorMessage: message,
        },
      });
      this.logger.error(`Data export ${exportId} failed: ${message}`);
    }
  }

  private async writeArchive(
    exportId: string,
    payload: unknown,
  ): Promise<string> {
    const exportDir = this.resolveExportDirectory();
    await mkdir(exportDir, { recursive: true });
    const archivePath = path.join(exportDir, `rgpd-export-${exportId}.json`);
    await writeFile(archivePath, JSON.stringify(payload, null, 2), 'utf8');
    return archivePath;
  }

  private resolveExportDirectory(): string {
    const configured = this.config.get<string>('DATA_EXPORT_DIR');
    if (configured) {
      return path.resolve(configured);
    }

    return path.resolve(process.cwd(), 'exports');
  }
}
