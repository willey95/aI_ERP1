import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: any) {
    const { search, status, page = 1, pageSize = 10 } = params || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          budgetItems: {
            select: {
              id: true,
              initialAmount: true,
              currentAmount: true,
              executedAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    // Calculate budget summary for each project
    const projectsWithBudget = projects.map((project) => {
      const totalRevenue = project.budgetItems
        .filter((item) => item.id)
        .reduce((sum, item) => sum + Number(item.currentAmount), 0);

      const executed = project.budgetItems
        .filter((item) => item.id)
        .reduce((sum, item) => sum + Number(item.executedAmount), 0);

      const remaining = totalRevenue - executed;
      const executionRate = totalRevenue > 0 ? (executed / totalRevenue) * 100 : 0;

      return {
        ...project,
        budget: {
          totalRevenue,
          totalExpense: totalRevenue * 0.8, // Placeholder
          executed,
          remaining,
          executionRate,
        },
      };
    });

    return {
      projects: projectsWithBudget,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        budgetItems: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });
  }

  async create(data: any, userId: string) {
    return this.prisma.project.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
