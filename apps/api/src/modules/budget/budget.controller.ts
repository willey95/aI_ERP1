import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';

@Controller('projects/:projectId/budget')
@UseGuards(AuthGuard('jwt'))
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Get()
  getProjectBudget(@Param('projectId') projectId: string) {
    return this.budgetService.getProjectBudget(projectId);
  }

  @Get('items')
  getBudgetItems(@Param('projectId') projectId: string) {
    return this.budgetService.getBudgetItems(projectId);
  }

  @Post('items')
  createBudgetItem(@Param('projectId') projectId: string, @Body() data: any) {
    return this.budgetService.createBudgetItem(projectId, data);
  }

  @Patch('items/:itemId')
  updateBudgetItem(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Body() data: any,
  ) {
    return this.budgetService.updateBudgetItem(projectId, itemId, data);
  }

  @Delete('items/:itemId')
  deleteBudgetItem(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.budgetService.deleteBudgetItem(projectId, itemId);
  }

  @Get('items/:itemId/changes')
  getBudgetChanges(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.budgetService.getBudgetChanges(projectId, itemId);
  }
}
