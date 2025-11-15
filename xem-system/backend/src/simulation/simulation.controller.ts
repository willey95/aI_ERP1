import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationService } from './simulation.service';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    return this.simulationService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.simulationService.findOne(id);
  }
}
