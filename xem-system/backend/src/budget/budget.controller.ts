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
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { BulkImportBudgetDto } from './dto/bulk-import-budget.dto';

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
  async create(@Body() createBudgetItemDto: CreateBudgetItemDto) {
    return this.budgetService.create(createBudgetItemDto);
  }

  @Post('bulk-import')
  async bulkImport(@Body() bulkImportDto: BulkImportBudgetDto) {
    return this.budgetService.bulkImport(bulkImportDto.items);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBudgetItemDto: UpdateBudgetItemDto) {
    return this.budgetService.update(id, updateBudgetItemDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }
}
