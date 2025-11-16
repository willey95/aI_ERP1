import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getFinancialModel(projectId: string) {
    const model = await this.prisma.financialModel.findFirst({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return model || { message: 'No financial model found' };
  }

  async getCashFlow(projectId: string) {
    const cashFlowItems = await this.prisma.cashFlowItem.findMany({
      where: { projectId },
      orderBy: {
        plannedDate: 'asc',
      },
    });

    return cashFlowItems;
  }
}
