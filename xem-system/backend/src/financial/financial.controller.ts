import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinancialService } from './financial.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private financialService: FinancialService) {}

  // ============================================
  // FINANCIAL MODEL MANAGEMENT
  // ============================================

  @Get('model/:projectId')
  async getFinancialModel(@Param('projectId') projectId: string) {
    return this.financialService.getFinancialModel(projectId);
  }

  @Get('model/:projectId/all')
  async getAllFinancialModels(@Param('projectId') projectId: string) {
    return this.financialService.getAllFinancialModels(projectId);
  }

  @Post('model/:projectId')
  async createFinancialModel(
    @Param('projectId') projectId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.financialService.createFinancialModel(projectId, data, user.id);
  }

  @Put('model/:projectId')
  async updateFinancialModel(
    @Param('projectId') projectId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.financialService.updateFinancialModel(projectId, data, user.id);
  }

  @Post('model/:projectId/calculate')
  async calculateFinancialModel(
    @Param('projectId') projectId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.financialService.calculateFinancialModel(projectId, data, user.id);
  }

  // ============================================
  // CASH FLOW MANAGEMENT
  // ============================================

  @Get('cashflow/:projectId')
  async getCashFlow(@Param('projectId') projectId: string) {
    return this.financialService.getCashFlow(projectId);
  }

  @Post('cashflow/:projectId')
  async createCashFlowItem(
    @Param('projectId') projectId: string,
    @Body() data: any,
  ) {
    return this.financialService.createCashFlowItem(projectId, data);
  }

  @Put('cashflow/:id')
  async updateCashFlowItem(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.financialService.updateCashFlowItem(id, data);
  }

  @Post('cashflow/:projectId/bulk')
  async createBulkCashFlowItems(
    @Param('projectId') projectId: string,
    @Body() data: { items: any[] },
  ) {
    return this.financialService.createBulkCashFlowItems(projectId, data.items);
  }

  @Get('cashflow/:projectId/summary')
  async getCashFlowSummary(@Param('projectId') projectId: string) {
    return this.financialService.getCashFlowSummary(projectId);
  }

  @Delete('cashflow/:id')
  async deleteCashFlowItem(@Param('id') id: string) {
    return this.financialService.deleteCashFlowItem(id);
  }

  @Post('cashflow/:id/approve-variance')
  async approveVariance(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.financialService.approveVariance(id, user.id);
  }

  @Get('cashflow/:projectId/export')
  async exportCashFlowExcel(
    @Param('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.financialService.exportCashFlowToExcel(projectId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cashflow_${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`,
    );

    res.send(buffer);
  }

  @Get('cashflow/:projectId/analytics')
  async getCashFlowAnalytics(@Param('projectId') projectId: string) {
    return this.financialService.getCashFlowAnalytics(projectId);
  }

  @Get('cashflow/:projectId/pivot')
  async getCashFlowPivot(@Param('projectId') projectId: string) {
    return this.financialService.getCashFlowPivot(projectId);
  }
}
