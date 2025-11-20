import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetTransferDto } from './dto/create-budget-transfer.dto';
import { ApproveBudgetTransferDto } from './dto/approve-budget-transfer.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetTransferService {
  constructor(private prisma: PrismaService) {}

  /**
   * 예산 전용 요청 생성
   */
  async createTransfer(userId: string, dto: CreateBudgetTransferDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. 출처 및 대상 예산 항목 조회
      const [sourceItem, targetItem] = await Promise.all([
        tx.budgetItem.findUnique({ where: { id: dto.sourceItemId } }),
        tx.budgetItem.findUnique({ where: { id: dto.targetItemId } }),
      ]);

      if (!sourceItem) {
        throw new NotFoundException(`Source budget item not found: ${dto.sourceItemId}`);
      }

      if (!targetItem) {
        throw new NotFoundException(`Target budget item not found: ${dto.targetItemId}`);
      }

      // 2. 같은 프로젝트인지 확인
      if (sourceItem.projectId !== targetItem.projectId) {
        throw new BadRequestException('Source and target budget items must be in the same project');
      }

      // 3. 같은 항목인지 확인
      if (dto.sourceItemId === dto.targetItemId) {
        throw new BadRequestException('Cannot transfer to the same budget item');
      }

      // 4. 전용 금액 검증
      const transferAmount = new Decimal(dto.amount);

      if (transferAmount.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Transfer amount must be greater than 0');
      }

      if (transferAmount.greaterThan(sourceItem.remainingBeforeExec)) {
        throw new BadRequestException(
          `Insufficient budget. Available: ${sourceItem.remainingBeforeExec}, Requested: ${transferAmount}`
        );
      }

      // 5. FULL 전용인 경우 전체 잔액으로 설정
      const finalAmount = dto.transferType === 'FULL'
        ? sourceItem.remainingBeforeExec
        : transferAmount;

      // 6. 예산 전용 생성
      const transfer = await tx.budgetTransfer.create({
        data: {
          sourceItemId: dto.sourceItemId,
          targetItemId: dto.targetItemId,
          amount: finalAmount,
          transferType: dto.transferType,
          reason: dto.reason,
          description: dto.description,
          executionRequestId: dto.executionRequestId,
          createdById: userId,
          status: 'PENDING',
        },
        include: {
          sourceItem: {
            select: {
              id: true,
              category: true,
              mainItem: true,
              subItem: true,
              remainingBeforeExec: true,
              remainingAfterExec: true,
              pendingExecutionAmount: true,
            },
          },
          targetItem: {
            select: {
              id: true,
              category: true,
              mainItem: true,
              subItem: true,
              remainingBeforeExec: true,
              remainingAfterExec: true,
              pendingExecutionAmount: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return transfer;
    });
  }

  /**
   * 예산 전용 승인
   */
  async approveTransfer(transferId: string, userId: string, dto: ApproveBudgetTransferDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. 전용 조회
      const transfer = await tx.budgetTransfer.findUnique({
        where: { id: transferId },
        include: {
          sourceItem: true,
          targetItem: true,
        },
      });

      if (!transfer) {
        throw new NotFoundException(`Budget transfer not found: ${transferId}`);
      }

      // 2. 이미 처리된 전용인지 확인
      if (transfer.status !== 'PENDING') {
        throw new BadRequestException(`This transfer has already been ${transfer.status.toLowerCase()}`);
      }

      // 3. 승인자 권한 확인
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || !['ADMIN', 'APPROVER', 'CFO', 'RM_TEAM'].includes(user.role)) {
        throw new ForbiddenException('Only APPROVER, CFO, RM_TEAM, or ADMIN can approve transfers');
      }

      if (dto.approved) {
        // 4. 승인: 예산 전용 실행
        // 4-1. 출처 항목 예산 감소
        const newSourceBudget = transfer.sourceItem.currentBudget.minus(transfer.amount);
        const newSourceRemainingBeforeExec = transfer.sourceItem.remainingBeforeExec.minus(transfer.amount);
        const newSourceRemainingAfterExec = newSourceRemainingBeforeExec.minus(transfer.sourceItem.pendingExecutionAmount);
        const newSourceRate = newSourceBudget.equals(0)
          ? 0
          : transfer.sourceItem.executedAmount.dividedBy(newSourceBudget).times(100).toNumber();

        await tx.budgetItem.update({
          where: { id: transfer.sourceItemId },
          data: {
            currentBudget: newSourceBudget,
            remainingBeforeExec: newSourceRemainingBeforeExec,
            remainingAfterExec: newSourceRemainingAfterExec,
            executionRate: newSourceRate,
            changeReason: `예산 전용: ${transfer.amount.toString()}원 전출 (전용 ID: ${transferId})`,
            changedAt: new Date(),
          },
        });

        // 4-2. 대상 항목 예산 증가
        const newTargetBudget = transfer.targetItem.currentBudget.plus(transfer.amount);
        const newTargetRemainingBeforeExec = transfer.targetItem.remainingBeforeExec.plus(transfer.amount);
        const newTargetRemainingAfterExec = newTargetRemainingBeforeExec.minus(transfer.targetItem.pendingExecutionAmount);
        const newTargetRate = newTargetBudget.equals(0)
          ? 0
          : transfer.targetItem.executedAmount.dividedBy(newTargetBudget).times(100).toNumber();

        await tx.budgetItem.update({
          where: { id: transfer.targetItemId },
          data: {
            currentBudget: newTargetBudget,
            remainingBeforeExec: newTargetRemainingBeforeExec,
            remainingAfterExec: newTargetRemainingAfterExec,
            executionRate: newTargetRate,
            changeReason: `예산 전용: ${transfer.amount.toString()}원 전입 (전용 ID: ${transferId})`,
            changedAt: new Date(),
          },
        });

        // 4-3. 전용 상태 업데이트
        const approvedTransfer = await tx.budgetTransfer.update({
          where: { id: transferId },
          data: {
            status: 'APPROVED',
            approvedById: userId,
            approvedAt: new Date(),
          },
          include: {
            sourceItem: true,
            targetItem: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          success: true,
          message: 'Budget transfer approved successfully',
          transfer: approvedTransfer,
        };
      } else {
        // 5. 반려
        const rejectedTransfer = await tx.budgetTransfer.update({
          where: { id: transferId },
          data: {
            status: 'REJECTED',
            approvedById: userId,
            approvedAt: new Date(),
            rejectionReason: dto.rejectionReason || dto.decision,
          },
          include: {
            sourceItem: true,
            targetItem: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          success: true,
          message: 'Budget transfer rejected',
          transfer: rejectedTransfer,
        };
      }
    });
  }

  /**
   * 전용 이력 조회 (프로젝트별)
   */
  async getTransferHistory(projectId: string, status?: string) {
    // 프로젝트의 예산 항목 ID 조회
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
      select: { id: true },
    });

    const budgetItemIds = budgetItems.map((item) => item.id);

    const where: any = {
      OR: [
        { sourceItemId: { in: budgetItemIds } },
        { targetItemId: { in: budgetItemIds } },
      ],
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.budgetTransfer.findMany({
      where,
      include: {
        sourceItem: {
          select: {
            id: true,
            category: true,
            mainItem: true,
            subItem: true,
            currentBudget: true,
            remainingBeforeExec: true,
            remainingAfterExec: true,
            pendingExecutionAmount: true,
          },
        },
        targetItem: {
          select: {
            id: true,
            category: true,
            mainItem: true,
            subItem: true,
            currentBudget: true,
            remainingBeforeExec: true,
            remainingAfterExec: true,
            pendingExecutionAmount: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        executionRequest: {
          select: {
            id: true,
            requestNumber: true,
            purpose: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 대기 중인 전용 조회
   */
  async getPendingTransfers(projectId?: string) {
    const where: any = {
      status: 'PENDING',
    };

    if (projectId) {
      const budgetItems = await this.prisma.budgetItem.findMany({
        where: { projectId },
        select: { id: true },
      });

      const budgetItemIds = budgetItems.map((item) => item.id);

      where.OR = [
        { sourceItemId: { in: budgetItemIds } },
        { targetItemId: { in: budgetItemIds } },
      ];
    }

    return this.prisma.budgetTransfer.findMany({
      where,
      include: {
        sourceItem: {
          select: {
            id: true,
            category: true,
            mainItem: true,
            subItem: true,
            remainingBeforeExec: true,
            remainingAfterExec: true,
            pendingExecutionAmount: true,
            projectId: true,
          },
        },
        targetItem: {
          select: {
            id: true,
            category: true,
            mainItem: true,
            subItem: true,
            remainingBeforeExec: true,
            remainingAfterExec: true,
            pendingExecutionAmount: true,
            projectId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * 전용 상세 조회
   */
  async getTransferById(transferId: string) {
    const transfer = await this.prisma.budgetTransfer.findUnique({
      where: { id: transferId },
      include: {
        sourceItem: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        targetItem: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        executionRequest: {
          select: {
            id: true,
            requestNumber: true,
            purpose: true,
            description: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Budget transfer not found: ${transferId}`);
    }

    return transfer;
  }

  /**
   * 예산 항목의 전용 가능한 금액 계산
   */
  async calculateAvailableForTransfer(budgetItemId: string) {
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id: budgetItemId },
    });

    if (!budgetItem) {
      throw new NotFoundException(`Budget item not found: ${budgetItemId}`);
    }

    // 진행 중인 전용 조회 (출처로 사용)
    const pendingTransfersOut = await this.prisma.budgetTransfer.findMany({
      where: {
        sourceItemId: budgetItemId,
        status: 'PENDING',
      },
      select: {
        amount: true,
      },
    });

    const pendingOutAmount = pendingTransfersOut.reduce(
      (sum, t) => sum.plus(t.amount),
      new Decimal(0)
    );

    const availableForTransfer = budgetItem.remainingBeforeExec.minus(pendingOutAmount);

    return {
      budgetItemId,
      currentBudget: budgetItem.currentBudget,
      executedAmount: budgetItem.executedAmount,
      remainingBeforeExec: budgetItem.remainingBeforeExec,
      remainingAfterExec: budgetItem.remainingAfterExec,
      pendingExecutionAmount: budgetItem.pendingExecutionAmount,
      pendingTransferOut: pendingOutAmount,
      availableForTransfer: availableForTransfer.greaterThan(0) ? availableForTransfer : new Decimal(0),
    };
  }
}
