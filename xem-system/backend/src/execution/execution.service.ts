import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { projectId, status, sortBy = 'createdAt', order = 'desc' } = query;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const executions = await this.prisma.executionRequest.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        budgetItem: {
          select: {
            mainItem: true,
            subItem: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: {
          orderBy: {
            step: 'asc',
          },
        },
      },
    });

    return executions;
  }

  async findOne(id: string) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id },
      include: {
        project: true,
        budgetItem: true,
        requestedBy: true,
        approvals: {
          orderBy: {
            step: 'asc',
          },
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
        },
      },
    });

    if (!execution) {
      throw new NotFoundException('Execution request not found');
    }

    return execution;
  }

  async create(data: any, userId: string) {
    const { projectId, budgetItemId, amount, executionDate, purpose, description, attachments } = data;

    // Validate budget item has sufficient balance
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id: budgetItemId },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    const requestAmount = new Decimal(amount);
    if (requestAmount.greaterThan(budgetItem.remainingBudget)) {
      throw new BadRequestException('Insufficient budget balance');
    }

    // Generate request number
    const requestNumber = await this.generateRequestNumber();

    // Create execution request
    const execution = await this.prisma.executionRequest.create({
      data: {
        requestNumber,
        projectId,
        budgetItemId,
        requestedById: userId,
        amount: requestAmount,
        executionDate: new Date(executionDate),
        purpose,
        description,
        attachments: attachments || [],
        status: 'PENDING',
        currentStep: 1,
      },
    });

    // Create approval workflow (2 steps: 담당자 → 승인권자)
    const approvalSteps = [
      { step: 1, approverRole: 'STAFF' },      // 담당자 제출 (자동 승인)
      { step: 2, approverRole: 'APPROVER' },   // 승인권자 승인
    ];

    for (const approval of approvalSteps) {
      await this.prisma.approval.create({
        data: {
          executionRequestId: execution.id,
          step: approval.step,
          approverRole: approval.approverRole,
          status: approval.step === 1 ? 'APPROVED' : 'PENDING', // STAFF step auto-approved
          approverId: approval.step === 1 ? userId : null,      // STAFF auto-assigned
          decidedAt: approval.step === 1 ? new Date() : null,
        },
      });
    }

    // Auto-advance to step 2 (APPROVER)
    await this.prisma.executionRequest.update({
      where: { id: execution.id },
      data: {
        currentStep: 2,
      },
    });

    return execution;
  }

  async update(id: string, data: any) {
    const execution = await this.prisma.executionRequest.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return execution;
  }

  async cancel(id: string, userId: string) {
    const execution = await this.findOne(id);

    if (execution.requestedById !== userId) {
      throw new BadRequestException('Only the requester can cancel');
    }

    if (execution.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending requests');
    }

    return this.prisma.executionRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });
  }

  private async generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.executionRequest.count({
      where: {
        requestNumber: {
          startsWith: `EXE-${year}-`,
        },
      },
    });

    return `EXE-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
