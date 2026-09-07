import { Seller } from '../seller.entity';

/**
 * Small, focused interface (ISP): only the operations the Sellers module
 * actually needs, nothing a generic "database access" interface would bloat
 * it with. Any storage technology (Postgres, in-memory, etc.) can implement
 * this and be swapped in without changing SellersService (OCP + LSP).
 */
export interface ISellerRepository {
  findById(id: string): Promise<Seller | null>;
  findByEmail(email: string): Promise<Seller | null>;
  save(seller: Seller): Promise<Seller>;
}

// DI token - NestJS needs a token (not just a TS interface, which vanishes
// at runtime) to know what to inject where an ISellerRepository is required.
export const SELLER_REPOSITORY = Symbol('SELLER_REPOSITORY');
