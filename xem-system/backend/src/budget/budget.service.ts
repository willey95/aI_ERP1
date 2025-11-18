import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async getProjectBudget(projectId: string) {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Group by category
    const grouped = budgetItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate totals for each category
    const summary = Object.keys(grouped).map((category) => {
      const items = grouped[category];
      return {
        category,
        items,
        totals: {
          initialBudget: items.reduce(
            (sum, item) => sum.plus(item.initialBudget),
            new Decimal(0)
          ),
          currentBudget: items.reduce(
            (sum, item) => sum.plus(item.currentBudget),
            new Decimal(0)
          ),
          executedAmount: items.reduce(
            (sum, item) => sum.plus(item.executedAmount),
            new Decimal(0)
          ),
          remainingBudget: items.reduce(
            (sum, item) => sum.plus(item.remainingBudget),
            new Decimal(0)
          ),
        },
      };
    });

    // Calculate grand totals
    const grandTotals = {
      initialBudget: budgetItems.reduce(
        (sum, item) => sum.plus(item.initialBudget),
        new Decimal(0)
      ),
      currentBudget: budgetItems.reduce(
        (sum, item) => sum.plus(item.currentBudget),
        new Decimal(0)
      ),
      executedAmount: budgetItems.reduce(
        (sum, item) => sum.plus(item.executedAmount),
        new Decimal(0)
      ),
      remainingBudget: budgetItems.reduce(
        (sum, item) => sum.plus(item.remainingBudget),
        new Decimal(0)
      ),
    };

    return {
      summary,
      grandTotals,
    };
  }

  async findOne(id: string) {
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    return budgetItem;
  }

  async create(data: any) {
    const {
      projectId,
      category,
      mainItem,
      subItem,
      currentBudget,
      displayOrder,
    } = data;

    const budget = new Decimal(currentBudget);

    const budgetItem = await this.prisma.budgetItem.create({
      data: {
        projectId,
        category,
        mainItem,
        subItem,
        initialBudget: budget,
        currentBudget: budget,
        executedAmount: new Decimal(0),
        remainingBudget: budget,
        remainingBeforeExec: budget,
        remainingAfterExec: budget,
        pendingExecutionAmount: new Decimal(0),
        executionRate: 0,
        displayOrder: displayOrder || 0,
      },
    });

    await this.updateProjectBudget(projectId);
    return budgetItem;
  }

  async bulkImport(items: any[]) {
    if (!items || items.length === 0) {
      throw new Error('No items to import');
    }

    // Get the projectId from the first item
    const projectId = items[0].projectId;

    // Validate that all items have the same projectId
    const allSameProject = items.every(item => item.projectId === projectId);
    if (!allSameProject) {
      throw new Error('All items must belong to the same project');
    }

    // Create all budget items
    const createdItems = await Promise.all(
      items.map(async (item, index) => {
        const {
          category,
          mainItem,
          subItem,
          currentBudget,
        } = item;

        const budget = new Decimal(currentBudget);

        return this.prisma.budgetItem.create({
          data: {
            projectId,
            category,
            mainItem,
            subItem: subItem || null,
            initialBudget: budget,
            currentBudget: budget,
            executedAmount: new Decimal(0),
            remainingBudget: budget,
            remainingBeforeExec: budget,
            remainingAfterExec: budget,
            pendingExecutionAmount: new Decimal(0),
            executionRate: 0,
            displayOrder: index,
          },
        });
      })
    );

    // Update project budget once after all items are created
    await this.updateProjectBudget(projectId);

    return {
      created: createdItems.length,
      items: createdItems,
    };
  }

  async update(id: string, data: any) {
    const budgetItem = await this.prisma.budgetItem.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await this.updateProjectBudget(budgetItem.projectId);
    return budgetItem;
  }

  async remove(id: string) {
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    await this.prisma.budgetItem.update({
      where: { id },
      data: { isActive: false },
    });

    await this.updateProjectBudget(budgetItem.projectId);
    return { message: 'Budget item removed successfully' };
  }

  private async updateProjectBudget(projectId: string) {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
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

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        currentBudget: totalBudget,
        executedAmount: totalExecuted,
        remainingBudget: remaining,
        executionRate,
      },
    });
  }
}
