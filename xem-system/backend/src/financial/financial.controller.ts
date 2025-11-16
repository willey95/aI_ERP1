import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinancialService } from './financial.service';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private financialService: FinancialService) {}

  @Get('model/:projectId')
  async getFinancialModel(@Param('projectId') projectId: string) {
    return this.financialService.getFinancialModel(projectId);
  }

  @Get('cashflow/:projectId')
  async getCashFlow(@Param('projectId') projectId: string) {
    return this.financialService.getCashFlow(projectId);
  }
}
