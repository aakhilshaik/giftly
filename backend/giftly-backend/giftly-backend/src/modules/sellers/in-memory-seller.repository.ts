import { Injectable } from '@nestjs/common';
import { ISellerRepository } from './interfaces/seller-repository.interface';
import { Seller } from './seller.entity';

/**
 * Temporary implementation so the module works end-to-end before a real
 * database is wired up. When Postgres is added later, a PostgresSellerRepository
 * implementing the same ISellerRepository interface can replace this in the
 * module's providers - SellersService never needs to change (OCP in action).
 */
@Injectable()
export class InMemorySellerRepository implements ISellerRepository {
  private readonly sellers = new Map<string, Seller>();

  async findById(id: string): Promise<Seller | null> {
    return this.sellers.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Seller | null> {
    for (const seller of this.sellers.values()) {
      if (seller.email === email) return seller;
    }
    return null;
  }

  async save(seller: Seller): Promise<Seller> {
    this.sellers.set(seller.id, seller);
    return seller;
  }
}
