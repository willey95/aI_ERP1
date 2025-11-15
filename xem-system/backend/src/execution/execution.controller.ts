import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionService } from './execution.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('execution')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private executionService: ExecutionService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.executionService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.executionService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.executionService.create(data, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.executionService.update(id, data);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.executionService.cancel(id, user.id);
  }
}
