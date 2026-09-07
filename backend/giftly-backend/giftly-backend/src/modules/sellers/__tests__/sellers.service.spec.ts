import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SellersService } from '../sellers.service';
import { ISellerRepository, SELLER_REPOSITORY } from '../interfaces/seller-repository.interface';
import { Seller } from '../seller.entity';

// A hand-written mock satisfying the ISellerRepository interface.
// Because SellersService depends on the interface, not a concrete class,
// this test never touches a real database, network, or filesystem.
function createMockRepository(): jest.Mocked<ISellerRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
  };
}

describe('SellersService', () => {
  let service: SellersService;
  let repository: jest.Mocked<ISellerRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellersService,
        { provide: SELLER_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get<SellersService>(SellersService);
  });

  describe('apply', () => {
    it('creates a new pending seller when the email is not already registered', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.save.mockImplementation(async (seller) => seller);

      const result = await service.apply({
        email: 'maker@example.ca',
        displayName: 'Maple & Thread',
        tier: 'artisan',
      });

      expect(result.status).toBe('pending');
      expect(result.email).toBe('maker@example.ca');
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('throws a ConflictException when the email has already applied', async () => {
      repository.findByEmail.mockResolvedValue(
        new Seller('existing-id', 'maker@example.ca', 'Existing Shop', 'business', 'pending', new Date()),
      );

      await expect(
        service.apply({ email: 'maker@example.ca', displayName: 'New Shop', tier: 'business' }),
      ).rejects.toThrow(ConflictException);

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('approves a pending seller', async () => {
      const pendingSeller = new Seller('id-1', 'a@b.ca', 'Shop', 'artisan', 'pending', new Date());
      repository.findById.mockResolvedValue(pendingSeller);
      repository.save.mockImplementation(async (seller) => seller);

      const result = await service.approve('id-1');

      expect(result.status).toBe('approved');
    });

    it('throws NotFoundException when the seller does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.approve('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('throws when trying to approve a seller that is not pending', async () => {
      const alreadyApproved = new Seller('id-2', 'a@b.ca', 'Shop', 'artisan', 'approved', new Date());
      repository.findById.mockResolvedValue(alreadyApproved);

      await expect(service.approve('id-2')).rejects.toThrow(
        'Cannot approve a seller with status "approved"',
      );
    });
  });
});
