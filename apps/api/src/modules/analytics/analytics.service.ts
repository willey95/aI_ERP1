import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [totalProjects, activeProjects, pendingApprovals] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.execution.count({ where: { status: 'SUBMITTED' } }),
    ]);

    return {
      totalProjects,
      activeProjects,
      totalBudget: 0,
      totalExecuted: 0,
      averageExecutionRate: 0,
      pendingApprovals,
      recentExecutions: [],
      riskAlerts: [],
    };
  }
}
