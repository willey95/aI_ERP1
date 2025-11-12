import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionService } from './execution.service';

@Controller('executions')
@UseGuards(AuthGuard('jwt'))
export class ExecutionController {
  constructor(private executionService: ExecutionService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.executionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.executionService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.executionService.create(data, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.executionService.update(id, data, req.user.id);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req) {
    return this.executionService.submit(id, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.executionService.delete(id, req.user.id);
  }
}
