import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetCalculatorService } from './budget-calculator.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetCalculatorController {
  constructor(
    private readonly budgetCalculatorService: BudgetCalculatorService,
  ) {}

  // ============================================
  // FORMULA MANAGEMENT
  // ============================================

  @Get('formulas')
  async getFormulas(@Query('category') category?: string) {
    return this.budgetCalculatorService.getFormulas(category);
  }

  @Get('formulas/:id')
  async getFormulaById(@Param('id') id: string) {
    return this.budgetCalculatorService.getFormulaById(id);
  }

  @Post('formulas')
  async createFormula(@Body() data: any, @CurrentUser() user: any) {
    return this.budgetCalculatorService.createFormula(data);
  }

  @Put('formulas/:id')
  async updateFormula(@Param('id') id: string, @Body() data: any) {
    return this.budgetCalculatorService.updateFormula(id, data);
  }

  @Delete('formulas/:id')
  async deleteFormula(@Param('id') id: string) {
    return this.budgetCalculatorService.deleteFormula(id);
  }

  // ============================================
  // CALCULATION OPERATIONS
  // ============================================

  @Post('calculate')
  async calculate(@Body() data: any, @CurrentUser() user: any) {
    return this.budgetCalculatorService.calculate(
      data.formulaId,
      data.projectId,
      data.variables,
      user.id,
    );
  }

  @Post('recalculate/:projectId')
  async recalculateProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.budgetCalculatorService.recalculateProject(projectId, user.id);
  }

  // ============================================
  // VARIABLE MANAGEMENT
  // ============================================

  @Get('variables/:projectId')
  async getProjectVariables(@Param('projectId') projectId: string) {
    return this.budgetCalculatorService.getProjectVariables(projectId);
  }

  @Put('variables/:projectId')
  async updateProjectVariables(
    @Param('projectId') projectId: string,
    @Body() data: any,
  ) {
    return this.budgetCalculatorService.updateProjectVariables(
      projectId,
      data.variables,
    );
  }

  // ============================================
  // BUDGET ITEM OPERATIONS
  // ============================================

  @Get('project/:projectId/detailed')
  async getDetailedBudget(@Param('projectId') projectId: string) {
    return this.budgetCalculatorService.getDetailedBudget(projectId);
  }

  @Post('custom-items')
  async createCustomItem(@Body() data: any, @CurrentUser() user: any) {
    return this.budgetCalculatorService.createCustomItem(data);
  }

  @Put('custom-items/:id')
  async updateCustomItem(@Param('id') id: string, @Body() data: any) {
    return this.budgetCalculatorService.updateCustomItem(id, data);
  }

  @Delete('custom-items/:id')
  async deleteCustomItem(@Param('id') id: string) {
    return this.budgetCalculatorService.deleteCustomItem(id);
  }

  // ============================================
  // ANALYSIS & REPORTING
  // ============================================

  @Get('items/:id/calculation-history')
  async getCalculationHistory(@Param('id') id: string) {
    return this.budgetCalculatorService.getCalculationHistory(id);
  }

  @Post('bulk-update/:projectId')
  async bulkUpdate(
    @Param('projectId') projectId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.budgetCalculatorService.bulkUpdateItems(
      projectId,
      data.items,
      user.id,
    );
  }

  @Get('comparison/:projectId')
  async getComparison(@Param('projectId') projectId: string) {
    return this.budgetCalculatorService.getBudgetComparison(projectId);
  }

  @Get('search/:projectId')
  async searchBudgetItems(
    @Param('projectId') projectId: string,
    @Query('q') query: string,
  ) {
    return this.budgetCalculatorService.searchBudgetItems(projectId, query);
  }

  // ============================================
  // TEMPLATES
  // ============================================

  @Post('templates')
  async createTemplate(@Body() data: any, @CurrentUser() user: any) {
    return this.budgetCalculatorService.createTemplate(data, user.id);
  }

  @Get('templates')
  async getTemplates() {
    return this.budgetCalculatorService.getTemplates();
  }

  @Post('templates/:templateId/apply/:projectId')
  async applyTemplate(
    @Param('templateId') templateId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.budgetCalculatorService.applyTemplate(
      templateId,
      projectId,
      user.id,
    );
  }
}
