import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { InitiatePaymentDto } from '../dto/payments.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUEST, Role.FRONT_DESK)
  @Post('initiate')
  async initiate(@Body() initiatePaymentDto: InitiatePaymentDto) {
    return this.paymentsService.initiate(initiatePaymentDto);
  }

  @Post('webhook')
  async webhook(@Body() payload: any) {
    // In production, verify signature here using crypto
    await this.paymentsService.verifyWebhook(payload.event, payload.data);
    return { status: 'ok' };
  }
}
