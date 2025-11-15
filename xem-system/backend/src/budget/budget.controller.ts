import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetService } from './budget.service';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Get('project/:projectId')
  async getProjectBudget(@Param('projectId') projectId: string) {
    return this.budgetService.getProjectBudget(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.budgetService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.budgetService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }
}
