import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    organization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization', async () => {
      const createDto = {
        name: 'Test Org',
        slug: 'test-org',
        billingEmail: 'billing@test.com',
        timezone: 'Europe/Paris',
      };

      const createdOrg = {
        id: '1',
        ...createDto,
        stripeAccountId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.organization.create.mockResolvedValue(createdOrg);

      const result = await service.create(createDto);

      expect(result).toEqual(createdOrg);
      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          slug: createDto.slug,
          billingEmail: createDto.billingEmail,
          timezone: createDto.timezone,
        }),
      });
    });

    it('should use default timezone UTC if not provided', async () => {
      const createDto = {
        name: 'Test Org',
        slug: 'test-org',
        billingEmail: 'billing@test.com',
      };

      const createdOrg = {
        id: '1',
        ...createDto,
        timezone: 'UTC',
        stripeAccountId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.organization.create.mockResolvedValue(createdOrg);

      await service.create(createDto);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timezone: 'UTC',
        }),
      });
    });

    it('should handle metadata if provided', async () => {
      const createDto = {
        name: 'Test Org',
        slug: 'test-org',
        billingEmail: 'billing@test.com',
        metadata: { key: 'value' },
      };

      const createdOrg = {
        id: '1',
        name: createDto.name,
        slug: createDto.slug,
        billingEmail: createDto.billingEmail,
        timezone: 'UTC',
        stripeAccountId: null,
        metadata: createDto.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.organization.create.mockResolvedValue(createdOrg);

      const result = await service.create(createDto);

      expect(result.metadata).toEqual({ key: 'value' });
    });
  });

  describe('findAll', () => {
    it('should return all organizations sorted by createdAt desc', async () => {
      const organizations = [
        {
          id: '2',
          name: 'Org 2',
          slug: 'org-2',
          billingEmail: 'org2@test.com',
          timezone: 'UTC',
          stripeAccountId: null,
          metadata: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date(),
        },
        {
          id: '1',
          name: 'Org 1',
          slug: 'org-1',
          billingEmail: 'org1@test.com',
          timezone: 'UTC',
          stripeAccountId: null,
          metadata: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.organization.findMany.mockResolvedValue(organizations);

      const result = await service.findAll();

      expect(result).toEqual(organizations);
      expect(mockPrismaService.organization.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no organizations exist', async () => {
      mockPrismaService.organization.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single organization', async () => {
      const org = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        billingEmail: 'test@test.com',
        timezone: 'UTC',
        stripeAccountId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(org);

      const result = await service.findOne('1');

      expect(result).toEqual(org);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error if organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedOrg = {
        id: '1',
        name: 'Updated Name',
        slug: 'test',
        billingEmail: 'test@test.com',
        timezone: 'UTC',
        stripeAccountId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedOrg);
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          name: 'Updated Name',
        }),
      });
    });

    it('should update multiple fields', async () => {
      const updateDto = {
        name: 'Updated Name',
        billingEmail: 'new@test.com',
        timezone: 'Europe/Paris',
      };
      const updatedOrg = {
        id: '1',
        ...updateDto,
        slug: 'test',
        stripeAccountId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.billingEmail).toBe('new@test.com');
      expect(result.timezone).toBe('Europe/Paris');
    });

    it('should only update provided fields', async () => {
      const updateDto = { name: 'New Name' };
      const updatedOrg = {
        id: '1',
        name: 'New Name',
        slug: 'original-slug',
        billingEmail: 'original@test.com',
        timezone: 'UTC',
        stripeAccountId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      await service.update('1', updateDto);

      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.not.objectContaining({
          slug: expect.anything(),
          billingEmail: expect.anything(),
        }),
      });
    });
  });
});
