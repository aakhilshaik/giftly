import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ISellerRepository, SELLER_REPOSITORY } from './interfaces/seller-repository.interface';
import { Seller } from './seller.entity';
import { ApplySellerDto } from './dto/apply-seller.dto';

/**
 * SRP: this class only orchestrates seller business rules (uniqueness,
 * approval workflow). It knows nothing about HTTP or how data is stored -
 * that's the controller's job and the repository's job, respectively.
 *
 * DIP: depends on the ISellerRepository abstraction, injected via the
 * SELLER_REPOSITORY token - not on a concrete class. Swapping storage
 * technology later never requires touching this file.
 */
@Injectable()
export class SellersService {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellerRepository: ISellerRepository,
  ) {}

  async apply(dto: ApplySellerDto): Promise<Seller> {
    const existing = await this.sellerRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A seller with this email has already applied.');
    }

    const seller = new Seller(
      randomUUID(),
      dto.email,
      dto.displayName,
      dto.tier,
      'pending',
      new Date(),
    );

    return this.sellerRepository.save(seller);
  }

  async approve(sellerId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException(`Seller ${sellerId} not found.`);
    }
    seller.approve();
    return this.sellerRepository.save(seller);
  }

  async reject(sellerId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException(`Seller ${sellerId} not found.`);
    }
    seller.reject();
    return this.sellerRepository.save(seller);
  }
}
