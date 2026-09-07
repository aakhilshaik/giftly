export type SellerTier = 'artisan' | 'business';
export type SellerStatus = 'pending' | 'approved' | 'rejected';

/**
 * Core domain entity. Deliberately has no knowledge of how it's persisted
 * (no database decorators here) - that's the repository's job, not the entity's.
 */
export class Seller {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly displayName: string,
    public readonly tier: SellerTier,
    public status: SellerStatus,
    public readonly createdAt: Date,
  ) {}

  approve(): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot approve a seller with status "${this.status}"`);
    }
    this.status = 'approved';
  }

  reject(): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot reject a seller with status "${this.status}"`);
    }
    this.status = 'rejected';
  }
}
