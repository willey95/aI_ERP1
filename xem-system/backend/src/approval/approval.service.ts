import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ApprovalService {
  constructor(private prisma: PrismaService) {}

  async getPendingApprovals(userId: string) {
    // Get user's role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find approvals waiting for this user's role
    const approvals = await this.prisma.approval.findMany({
      where: {
        approverRole: user.role,
        status: 'PENDING',
      },
      include: {
        executionRequest: {
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
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return approvals;
  }

  async approve(id: string, userId: string, decision?: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        executionRequest: {
          include: {
            budgetItem: true,
          },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException('Approval already processed');
    }

    // Update approval
    await this.prisma.approval.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId: userId,
        decision,
        decidedAt: new Date(),
      },
    });

    const executionRequest = approval.executionRequest;

    // Check if this is the final approval
    const totalSteps = await this.prisma.approval.count({
      where: { executionRequestId: executionRequest.id },
    });

    if (approval.step === totalSteps) {
      // Final approval - update execution and budget
      await this.prisma.executionRequest.update({
        where: { id: executionRequest.id },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
      });

      // Update budget item
      const budgetItem = executionRequest.budgetItem;
      const newExecuted = budgetItem.executedAmount.plus(executionRequest.amount);
      const newRemaining = budgetItem.currentBudget.minus(newExecuted);
      const newRate = newExecuted.dividedBy(budgetItem.currentBudget).times(100).toNumber();

      await this.prisma.budgetItem.update({
        where: { id: budgetItem.id },
        data: {
          executedAmount: newExecuted,
          remainingBudget: newRemaining,
          executionRate: newRate,
        },
      });

      // Update project totals
      await this.updateProjectTotals(executionRequest.projectId);
    } else {
      // Move to next step
      await this.prisma.executionRequest.update({
        where: { id: executionRequest.id },
        data: {
          currentStep: approval.step + 1,
        },
      });
    }

    return { message: 'Approved successfully' };
  }

  async reject(id: string, userId: string, reason: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        executionRequest: true,
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException('Approval already processed');
    }

    // Update approval
    await this.prisma.approval.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId: userId,
        decision: reason,
        decidedAt: new Date(),
      },
    });

    // Update execution request
    await this.prisma.executionRequest.update({
      where: { id: approval.executionRequestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    return { message: 'Rejected successfully' };
  }

  private async updateProjectTotals(projectId: string) {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
    });

    const totalExecuted = budgetItems.reduce(
      (sum, item) => sum.plus(item.executedAmount),
      new Decimal(0)
    );

    const totalBudget = budgetItems.reduce(
      (sum, item) => sum.plus(item.currentBudget),
      new Decimal(0)
    );

    const remaining = totalBudget.minus(totalExecuted);
    const executionRate = totalExecuted.dividedBy(totalBudget).times(100).toNumber();

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        executedAmount: totalExecuted,
        remainingBudget: remaining,
        executionRate,
      },
    });
  }
}
