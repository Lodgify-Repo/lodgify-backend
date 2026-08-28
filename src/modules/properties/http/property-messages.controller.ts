import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PropertyMessagesService } from '../services/property-messages.service';
import { SendPropertyMessageDto } from '../dto/properties-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Properties - Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertyMessagesController {
  constructor(private readonly messagesService: PropertyMessagesService) {}

  @Get('messages/conversations')
  @ApiOperation({ summary: 'F-P08: Get all active property conversations for current user' })
  async getUserConversations(@Request() req: any) {
    return this.messagesService.getUserConversations(req.user.id);
  }

  @Get(':propertyId/messages')
  @ApiOperation({ summary: 'F-P08: Get conversation thread for a property' })
  @ApiQuery({ name: 'otherUserId', required: false, description: 'Guest or partner user ID when viewed by host' })
  async getThread(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Query('otherUserId') otherUserId?: string,
  ) {
    return this.messagesService.getThread(propertyId, req.user.id, otherUserId);
  }

  @Post(':propertyId/messages')
  @ApiOperation({ summary: 'F-P08: Send message to owner or guest regarding property/booking' })
  async sendMessage(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Body() dto: SendPropertyMessageDto,
  ) {
    return this.messagesService.sendMessage(propertyId, req.user.id, dto);
  }
}
