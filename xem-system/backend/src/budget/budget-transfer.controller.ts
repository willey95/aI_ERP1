import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BudgetTransferService } from './budget-transfer.service';
import { CreateBudgetTransferDto } from './dto/create-budget-transfer.dto';
import { ApproveBudgetTransferDto } from './dto/approve-budget-transfer.dto';

@Controller('budget/transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetTransferController {
  constructor(private readonly budgetTransferService: BudgetTransferService) {}

  /**
   * 예산 전용 요청 생성
   * 담당자(STAFF)가 예산 전용을 요청
   */
  @Post()
  @Roles('STAFF', 'TEAM_LEAD', 'ADMIN')
  async createTransfer(
    @Req() req: any,
    @Body() dto: CreateBudgetTransferDto,
  ) {
    const userId = req.user.id;
    return this.budgetTransferService.createTransfer(userId, dto);
  }

  /**
   * 예산 전용 승인/반려
   * 승인권자(APPROVER)가 전용을 승인하거나 반려
   */
  @Patch(':id/approve')
  @Roles('APPROVER', 'CFO', 'RM_TEAM', 'ADMIN')
  async approveTransfer(
    @Req() req: any,
    @Param('id') transferId: string,
    @Body() dto: ApproveBudgetTransferDto,
  ) {
    const userId = req.user.id;
    return this.budgetTransferService.approveTransfer(transferId, userId, dto);
  }

  /**
   * 전용 이력 조회 (프로젝트별)
   */
  @Get('project/:projectId')
  async getTransferHistory(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    return this.budgetTransferService.getTransferHistory(projectId, status);
  }

  /**
   * 대기 중인 전용 조회
   */
  @Get('pending')
  @Roles('APPROVER', 'CFO', 'RM_TEAM', 'ADMIN')
  async getPendingTransfers(
    @Query('projectId') projectId?: string,
  ) {
    return this.budgetTransferService.getPendingTransfers(projectId);
  }

  /**
   * 전용 상세 조회
   */
  @Get(':id')
  async getTransferById(@Param('id') transferId: string) {
    return this.budgetTransferService.getTransferById(transferId);
  }

  /**
   * 예산 항목의 전용 가능 금액 조회
   */
  @Get('available/:budgetItemId')
  async calculateAvailableForTransfer(@Param('budgetItemId') budgetItemId: string) {
    return this.budgetTransferService.calculateAvailableForTransfer(budgetItemId);
  }
}
