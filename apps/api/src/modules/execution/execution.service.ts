import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: any) {
    const { status, projectId, page = 1, pageSize = 10 } = params || {};

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const [executions, total] = await Promise.all([
      this.prisma.execution.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          budgetItem: {
            select: {
              id: true,
              name: true,
              code: true,
              currentAmount: true,
              executedAmount: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.execution.count({ where }),
    ]);

    return {
      executions: executions.map((exec) => ({
        ...exec,
        amount: Number(exec.amount),
        budgetItem: exec.budgetItem
          ? {
              ...exec.budgetItem,
              currentAmount: Number(exec.budgetItem.currentAmount),
              executedAmount: Number(exec.budgetItem.executedAmount),
              remainingAmount:
                Number(exec.budgetItem.currentAmount) -
                Number(exec.budgetItem.executedAmount),
            }
          : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
      include: {
        project: true,
        budgetItem: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        attachments: true,
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    return {
      ...execution,
      amount: Number(execution.amount),
      budgetItem: execution.budgetItem
        ? {
            ...execution.budgetItem,
            currentAmount: Number(execution.budgetItem.currentAmount),
            executedAmount: Number(execution.budgetItem.executedAmount),
            initialAmount: Number(execution.budgetItem.initialAmount),
          }
        : null,
    };
  }

  async create(data: any, userId: string) {
    // Check budget item existence and available balance
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id: data.budgetItemId },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    const remainingAmount =
      Number(budgetItem.currentAmount) - Number(budgetItem.executedAmount);

    if (data.amount > remainingAmount) {
      throw new BadRequestException(
        `Insufficient budget. Available: ${remainingAmount}, Requested: ${data.amount}`,
      );
    }

    // Generate execution number
    const year = new Date().getFullYear();
    const count = await this.prisma.execution.count({
      where: {
        executionNumber: {
          startsWith: `EXE-${year}-`,
        },
      },
    });
    const executionNumber = `EXE-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create execution
    const execution = await this.prisma.execution.create({
      data: {
        executionNumber,
        projectId: data.projectId,
        budgetItemId: data.budgetItemId,
        amount: new Decimal(data.amount),
        executionDate: new Date(data.executionDate),
        justification: data.justification,
        status: 'DRAFT',
        createdBy: userId,
      },
      include: {
        project: true,
        budgetItem: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      ...execution,
      amount: Number(execution.amount),
    };
  }

  async update(id: string, data: any, userId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    // Only allow update if status is DRAFT
    if (execution.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft executions can be updated',
      );
    }

    // Verify user is the creator
    if (execution.createdBy !== userId) {
      throw new BadRequestException(
        'Only the creator can update this execution',
      );
    }

    const updated = await this.prisma.execution.update({
      where: { id },
      data: {
        amount: data.amount ? new Decimal(data.amount) : undefined,
        executionDate: data.executionDate ? new Date(data.executionDate) : undefined,
        justification: data.justification,
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
    };
  }

  async submit(id: string, userId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    if (execution.status !== 'DRAFT') {
      throw new BadRequestException('Only draft executions can be submitted');
    }

    if (execution.createdBy !== userId) {
      throw new BadRequestException(
        'Only the creator can submit this execution',
      );
    }

    const updated = await this.prisma.execution.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        currentStep: 'MANAGER',
        submittedAt: new Date(),
      },
    });

    // TODO: Send notification to approvers

    return {
      ...updated,
      amount: Number(updated.amount),
    };
  }

  async delete(id: string, userId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    if (execution.status !== 'DRAFT') {
      throw new BadRequestException('Only draft executions can be deleted');
    }

    if (execution.createdBy !== userId) {
      throw new BadRequestException(
        'Only the creator can delete this execution',
      );
    }

    await this.prisma.execution.delete({
      where: { id },
    });

    return { message: 'Execution deleted successfully' };
  }
}
