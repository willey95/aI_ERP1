import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

    // Find approvals waiting for this user's role AND matching current step
    const approvals = await this.prisma.approval.findMany({
      where: {
        approverRole: user.role,
        status: 'PENDING',
        // Only show approvals that are at the current step
        executionRequest: {
          status: 'PENDING',
        },
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
                remainingBeforeExec: true,
                remainingAfterExec: true,
                pendingExecutionAmount: true,
              },
            },
            requestedBy: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Filter to only include approvals at the current step
    const filteredApprovals = approvals.filter(
      (approval) => approval.step === approval.executionRequest.currentStep
    );

    return filteredApprovals;
  }

  async approve(id: string, userId: string, decision?: string) {
    // Use transaction to ensure data integrity
    return await this.prisma.$transaction(async (tx) => {
      const approval = await tx.approval.findUnique({
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

      // Validation #1: Check user role matches required approver role
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== approval.approverRole) {
        throw new ForbiddenException(
          `This approval requires ${approval.approverRole} role. Your role: ${user?.role || 'unknown'}`
        );
      }

      // Validation #2: Check if this approval is the current step
      const executionRequest = approval.executionRequest;
      if (approval.step !== executionRequest.currentStep) {
        throw new BadRequestException(
          `This approval is step ${approval.step}, but current step is ${executionRequest.currentStep}`
        );
      }

      // Validation #3: Re-validate budget availability (for final approval)
      const totalSteps = await tx.approval.count({
        where: { executionRequestId: executionRequest.id },
      });

      if (approval.step === totalSteps) {
        // Final approval - re-check budget
        const budgetItem = executionRequest.budgetItem;
        const requestAmount = executionRequest.amount;

        if (requestAmount.greaterThan(budgetItem.remainingBeforeExec)) {
          throw new BadRequestException(
            `Insufficient budget. Requested: ${requestAmount}, Available: ${budgetItem.remainingBeforeExec}`
          );
        }
      }

      // Update approval
      await tx.approval.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approverId: userId,
          decision,
          decidedAt: new Date(),
        },
      });

      if (approval.step === totalSteps) {
        // Final approval - update execution and budget
        await tx.executionRequest.update({
          where: { id: executionRequest.id },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
          },
        });

        // Update budget item
        const budgetItem = executionRequest.budgetItem;
        const newExecuted = budgetItem.executedAmount.plus(executionRequest.amount);
        const newPending = budgetItem.pendingExecutionAmount.minus(executionRequest.amount);
        const newRemainingBeforeExec = budgetItem.currentBudget.minus(budgetItem.executedAmount);
        const newRemainingAfterExec = budgetItem.currentBudget.minus(newExecuted);
        const newRate = budgetItem.currentBudget.isZero()
          ? 0
          : newExecuted.dividedBy(budgetItem.currentBudget).times(100).toNumber();

        await tx.budgetItem.update({
          where: { id: budgetItem.id },
          data: {
            executedAmount: newExecuted,
            pendingExecutionAmount: newPending.greaterThanOrEqualTo(0) ? newPending : new Decimal(0),
            remainingBudget: newRemainingAfterExec,
            remainingBeforeExec: newRemainingBeforeExec,
            remainingAfterExec: newRemainingAfterExec,
            executionRate: newRate,
          },
        });

        // Update project totals (within transaction)
        const budgetItems = await tx.budgetItem.findMany({
          where: { projectId: executionRequest.projectId, isActive: true },
        });

        const totalBudget = budgetItems.reduce(
          (sum, item) => sum.plus(item.currentBudget),
          new Decimal(0)
        );

        const totalExecuted = budgetItems.reduce(
          (sum, item) => sum.plus(item.executedAmount),
          new Decimal(0)
        );

        const remaining = totalBudget.minus(totalExecuted);
        const executionRate = totalBudget.isZero()
          ? 0
          : totalExecuted.dividedBy(totalBudget).times(100).toNumber();

        await tx.project.update({
          where: { id: executionRequest.projectId },
          data: {
            executedAmount: totalExecuted,
            remainingBudget: remaining,
            executionRate,
          },
        });
      } else {
        // Move to next step
        await tx.executionRequest.update({
          where: { id: executionRequest.id },
          data: {
            currentStep: approval.step + 1,
          },
        });
      }

      return { message: 'Approved successfully' };
    });
  }

  async reject(id: string, userId: string, reason: string) {
    // Use transaction to ensure data integrity
    return await this.prisma.$transaction(async (tx) => {
      const approval = await tx.approval.findUnique({
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

      // Validation #1: Check user role matches required approver role
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== approval.approverRole) {
        throw new ForbiddenException(
          `This approval requires ${approval.approverRole} role. Your role: ${user?.role || 'unknown'}`
        );
      }

      // Validation #2: Check if this approval is the current step
      if (approval.step !== approval.executionRequest.currentStep) {
        throw new BadRequestException(
          `This approval is step ${approval.step}, but current step is ${approval.executionRequest.currentStep}`
        );
      }

      // Update approval
      await tx.approval.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approverId: userId,
          decision: reason,
          decidedAt: new Date(),
        },
      });

      // Mark all remaining pending approvals as SKIPPED
      await tx.approval.updateMany({
        where: {
          executionRequestId: approval.executionRequestId,
          status: 'PENDING',
          step: { gt: approval.step },
        },
        data: {
          status: 'SKIPPED',
          decidedAt: new Date(),
        },
      });

      // Decrease pending execution amount in budget item
      const executionRequest = approval.executionRequest;
      await tx.budgetItem.update({
        where: { id: executionRequest.budgetItemId },
        data: {
          pendingExecutionAmount: {
            decrement: executionRequest.amount,
          },
        },
      });

      // Update execution request
      await tx.executionRequest.update({
        where: { id: approval.executionRequestId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          completedAt: new Date(),
        },
      });

      return { message: 'Rejected successfully' };
    });
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
    const executionRate = totalBudget.isZero()
      ? 0
      : totalExecuted.dividedBy(totalBudget).times(100).toNumber();

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
