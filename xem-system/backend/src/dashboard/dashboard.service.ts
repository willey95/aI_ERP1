import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    // Get total projects
    const totalProjects = await this.prisma.project.count({
      where: { status: 'ACTIVE' },
    });

    // Get total budget
    const projects = await this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
    });

    const totalBudget = projects.reduce(
      (sum, p) => sum.plus(p.currentBudget),
      new Decimal(0)
    );

    const totalExecuted = projects.reduce(
      (sum, p) => sum.plus(p.executedAmount),
      new Decimal(0)
    );

    const avgExecutionRate =
      projects.reduce((sum, p) => sum + p.executionRate, 0) / (projects.length || 1);

    // Get pending approvals
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const pendingApprovals = await this.prisma.approval.count({
      where: {
        approverRole: user?.role,
        status: 'PENDING',
      },
    });

    // Get recent executions
    const recentExecutions = await this.prisma.executionRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        budgetItem: {
          select: {
            mainItem: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get risk alerts
    const riskProjects = projects.filter(p => p.executionRate > 75);

    return {
      stats: {
        totalProjects,
        totalBudget,
        totalExecuted,
        avgExecutionRate,
        pendingApprovals,
      },
      recentExecutions,
      riskAlerts: riskProjects.map(p => ({
        projectId: p.id,
        projectName: p.name,
        executionRate: p.executionRate,
        riskScore: p.riskScore,
      })),
    };
  }
}
