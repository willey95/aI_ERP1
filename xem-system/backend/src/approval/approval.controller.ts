import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApprovalService } from './approval.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('approval')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Get('pending')
  async getPendingApprovals(@CurrentUser() user: any) {
    return this.approvalService.getPendingApprovals(user.id);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { decision?: string },
    @CurrentUser() user: any,
  ) {
    return this.approvalService.approve(id, user.id, body.decision);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.approvalService.reject(id, user.id, body.reason);
  }
}
