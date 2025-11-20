import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationService } from './simulation.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  // ============================================
  // SIMULATION MANAGEMENT
  // ============================================

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    return this.simulationService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.simulationService.findOne(id);
  }

  @Post()
  async createSimulation(@Body() data: any, @CurrentUser() user: any) {
    return this.simulationService.createSimulation(data, user.id);
  }

  @Delete(':id')
  async deleteSimulation(@Param('id') id: string) {
    return this.simulationService.deleteSimulation(id);
  }

  // ============================================
  // SCENARIO ANALYSIS
  // ============================================

  @Post('run/:projectId')
  async runSimulation(
    @Param('projectId') projectId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.simulationService.runSimulation(projectId, data, user.id);
  }

  @Post('compare/:projectId')
  async compareScenarios(
    @Param('projectId') projectId: string,
    @Body() data: { scenarios: any[] },
    @CurrentUser() user: any,
  ) {
    return this.simulationService.compareScenarios(projectId, data.scenarios, user.id);
  }

  @Get('recommendations/:simulationId')
  async getRecommendations(@Param('simulationId') simulationId: string) {
    return this.simulationService.getRecommendations(simulationId);
  }
}
