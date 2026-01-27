import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuditActorType } from '@prisma/client';
import { DataExportsService } from './data-exports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

describe('DataExportsService', () => {
  let service: DataExportsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLog: jest.Mocked<AuditLogService>;

  const mockPrismaService = {
    dataExport: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DataExportsService);
    prisma = module.get(PrismaService);
    auditLog = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('requestExport', () => {
    it('should create export job with SLA due date', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00Z'));
      mockPrismaService.dataExport.create.mockResolvedValue({
        id: 'export-1',
      } as any);

      await service.requestExport('org-1', 'user-1');

      expect(prisma.dataExport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          requestedById: 'user-1',
          slaDueAt: new Date('2026-03-31T00:00:00Z'),
        }),
      });
    });
  });

  describe('processExport', () => {
    it('should write archive and mark export completed', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00Z'));
      mockPrismaService.dataExport.findUnique.mockResolvedValue({
        id: 'export-2',
        organizationId: 'org-2',
        requestedById: 'user-2',
        slaDueAt: new Date('2026-03-20T00:00:00Z'),
        status: 'PENDING',
      } as any);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-2',
        name: 'Org 2',
        users: [],
        customers: [],
        products: [],
        channels: [],
        subscriptions: [],
        paymentEvents: [],
        auditLogs: [],
      } as any);
      mockPrismaService.dataExport.update.mockResolvedValue({} as any);

      await service.processExport('export-2');

      expect(prisma.dataExport.update).toHaveBeenCalledWith({
        where: { id: 'export-2' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          archivePath: expect.stringContaining('export-2'),
          slaMet: true,
        }),
      });
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-2',
          actorType: AuditActorType.SYSTEM,
          action: 'rgpd.export.completed',
          resourceType: 'data_export',
          resourceId: 'export-2',
          correlationId: 'export-2',
          metadata: expect.objectContaining({
            archivePath: expect.any(String),
            slaMet: true,
            requestedById: 'user-2',
          }),
        }),
      );
    });
  });

  describe('processPendingExports', () => {
    it('should process pending exports in order', async () => {
      mockPrismaService.dataExport.findMany.mockResolvedValue([
        { id: 'export-3' },
        { id: 'export-4' },
      ] as any);
      const spy = jest.spyOn(service, 'processExport').mockResolvedValue();

      await service.processPendingExports();

      expect(spy).toHaveBeenCalledWith('export-3');
      expect(spy).toHaveBeenCalledWith('export-4');
    });
  });
});
