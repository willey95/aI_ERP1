import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SimulationService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    const simulations = await this.prisma.simulation.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return simulations;
  }

  async findOne(id: string) {
    return this.prisma.simulation.findUnique({
      where: { id },
    });
  }
}
