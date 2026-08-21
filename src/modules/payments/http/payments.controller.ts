import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { InitiatePaymentDto } from '../dto/payments.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUEST, Role.FRONT_DESK)
  @Post('initiate')
  @ApiOperation({ summary: 'Initiate' })
  async initiate(@Body() initiatePaymentDto: InitiatePaymentDto) {
    return this.paymentsService.initiate(initiatePaymentDto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf-8') || '';
    await this.paymentsService.verifyWebhook(rawBody, signature);
    return { status: 'ok' };
  }
}
