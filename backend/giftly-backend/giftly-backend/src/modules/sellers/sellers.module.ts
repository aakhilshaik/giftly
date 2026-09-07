import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { InMemorySellerRepository } from './in-memory-seller.repository';
import { SELLER_REPOSITORY } from './interfaces/seller-repository.interface';

/**
 * This module is the ONLY place that knows InMemorySellerRepository is the
 * concrete class behind SELLER_REPOSITORY. When a real database repository
 * exists, only this one line changes - SellersService and SellersController
 * stay untouched. That's the practical payoff of depending on interfaces.
 */
@Module({
  controllers: [SellersController],
  providers: [
    SellersService,
    { provide: SELLER_REPOSITORY, useClass: InMemorySellerRepository },
  ],
  exports: [SellersService],
})
export class SellersModule {}
