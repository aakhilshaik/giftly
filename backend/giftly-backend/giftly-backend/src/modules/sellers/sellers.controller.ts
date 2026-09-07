import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { ApplySellerDto } from './dto/apply-seller.dto';

/**
 * SRP: the controller's only job is translating HTTP requests into service
 * calls and service results into HTTP responses. No business rules live here.
 */
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('apply')
  apply(@Body() dto: ApplySellerDto) {
    return this.sellersService.apply(dto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.sellersService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.sellersService.reject(id);
  }
}
