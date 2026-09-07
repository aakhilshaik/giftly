import { SellerTier } from '../seller.entity';

export class ApplySellerDto {
  email!: string;
  displayName!: string;
  tier!: SellerTier;
}
