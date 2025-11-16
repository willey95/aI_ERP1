import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * 프로젝트 전체 사업비 LANDSCAPE
   * 담당자가 품의 작성 시 전체 예산 현황 파악
   */
  @Get('landscape/:projectId')
  async getProjectLandscape(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectLandscape(projectId);
  }

  /**
   * 집행 이력 (Timeline)
   * 승인권자가 집행 내역을 시간순으로 파악
   */
  @Get('execution-history/:projectId')
  async getExecutionHistory(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.analyticsService.getExecutionHistory(projectId, limitNum);
  }

  /**
   * 예산 전용 이력
   */
  @Get('transfer-history/:projectId')
  async getBudgetTransferHistory(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.analyticsService.getBudgetTransferHistory(projectId, limitNum);
  }

  /**
   * 승인권자용 상세 대시보드
   * - 집행 내역
   * - 예산 전용 내역
   * - 위험 지표
   * - 카테고리별 분석
   */
  @Get('approver-dashboard/:projectId')
  @Roles('APPROVER', 'CFO', 'RM_TEAM', 'TEAM_LEAD', 'ADMIN')
  async getApproverDashboard(
    @Param('projectId') projectId: string,
    @Query('executionRequestId') executionRequestId?: string,
  ) {
    return this.analyticsService.getApproverDashboard(projectId, executionRequestId);
  }

  /**
   * 위험 지표 계산
   */
  @Get('risk-indicators/:projectId')
  async calculateRiskIndicators(@Param('projectId') projectId: string) {
    return this.analyticsService.calculateRiskIndicators(projectId);
  }

  /**
   * 집행 요청 상세 분석
   * 승인권자가 특정 집행 요청의 정당성을 판단하기 위한 분석
   */
  @Get('execution-analysis/:executionRequestId')
  @Roles('APPROVER', 'CFO', 'RM_TEAM', 'TEAM_LEAD', 'ADMIN')
  async analyzeExecutionRequest(@Param('executionRequestId') executionRequestId: string) {
    return this.analyticsService.analyzeExecutionRequest(executionRequestId);
  }

  /**
   * 담당자용 품의 작성 지원
   * - 예산 가용성 체크
   * - 전용 가능한 예산 항목 추천
   */
  @Get('proposal-assistance')
  @Roles('STAFF', 'TEAM_LEAD', 'ADMIN')
  async getProposalAssistance(
    @Query('projectId') projectId: string,
    @Query('budgetItemId') budgetItemId: string,
    @Query('requestAmount') requestAmount: string,
  ) {
    const amount = parseFloat(requestAmount);
    return this.analyticsService.getProposalAssistance(projectId, budgetItemId, amount);
  }
}
