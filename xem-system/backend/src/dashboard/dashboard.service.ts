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
      include: {
        budgetItems: true,
      },
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

    // Execution rate heatmap data (by project)
    const executionHeatmap = projects.map(p => ({
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      executionRate: p.executionRate,
      riskLevel: p.executionRate > 90 ? 'CRITICAL' : p.executionRate > 75 ? 'WARNING' : 'NORMAL',
    }));

    // Monthly trend data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyExecutions = await this.prisma.executionRequest.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sixMonthsAgo },
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Process monthly data
    const monthlyTrends = this.processMonthlyTrends(monthlyExecutions);

    // Category breakdown (aggregate all budget items by category)
    const categoryBreakdown = await this.getCategoryBreakdown(projects);

    // Budget transfer statistics
    const transferStats = await this.prisma.budgetTransfer.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
      _count: true,
    });

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
      charts: {
        executionHeatmap,
        monthlyTrends,
        categoryBreakdown,
        transferStats: transferStats.map(ts => ({
          status: ts.status,
          totalAmount: ts._sum.amount || 0,
          count: ts._count,
        })),
      },
    };
  }

  private processMonthlyTrends(monthlyExecutions: any[]) {
    const monthMap = new Map<string, { month: string; totalAmount: number; count: number }>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      monthMap.set(monthKey, {
        month: monthKey,
        totalAmount: 0,
        count: 0,
      });
    }

    // Aggregate executions by month
    monthlyExecutions.forEach(exec => {
      const monthKey = new Date(exec.createdAt).toISOString().substring(0, 7);
      if (monthMap.has(monthKey)) {
        const current = monthMap.get(monthKey)!;
        current.totalAmount += Number(exec._sum.amount || 0);
        current.count += exec._count;
      }
    });

    return Array.from(monthMap.values());
  }

  private async getCategoryBreakdown(projects: any[]) {
    const categoryMap = new Map<string, { category: string; budget: number; executed: number }>();

    for (const project of projects) {
      for (const item of project.budgetItems || []) {
        const category = item.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            budget: 0,
            executed: 0,
          });
        }
        const current = categoryMap.get(category)!;
        current.budget += Number(item.currentBudget);
        current.executed += Number(item.executedAmount);
      }
    }

    return Array.from(categoryMap.values()).map(item => ({
      ...item,
      executionRate: item.budget > 0 ? (item.executed / item.budget) * 100 : 0,
    }));
  }
}
