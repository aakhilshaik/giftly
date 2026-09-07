import { Module } from '@nestjs/common';
import { SellersModule } from './modules/sellers/sellers.module';

/**
 * As Users, Listings, Orders, and Payments modules are added, they get
 * imported here too - each one independent, each only exposing what it
 * chooses to export. This is the "modular monolith": one deployable app,
 * strict internal module boundaries.
 */
@Module({
  imports: [SellersModule],
})
export class AppModule {}
