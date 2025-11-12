import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async getProjectBudget(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetItems: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Calculate revenue
    const revenueItems = project.budgetItems.filter(
      (item) => item.category === 'REVENUE',
    );
    const revenue = {
      presale:
        revenueItems
          .filter((item) => item.type === 'PRESALE')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      rental:
        revenueItems
          .filter((item) => item.type === 'RENTAL')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      other:
        revenueItems
          .filter((item) => item.type === 'OTHER')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      total: 0,
    };
    revenue.total = revenue.presale + revenue.rental + revenue.other;

    // Calculate expense
    const expenseItems = project.budgetItems.filter(
      (item) => item.category === 'EXPENSE',
    );
    const expense = {
      land:
        expenseItems
          .filter((item) => item.type === 'LAND')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      construction:
        expenseItems
          .filter((item) => item.type === 'CONSTRUCTION')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      design:
        expenseItems
          .filter((item) => item.type === 'DESIGN')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      contributions:
        expenseItems
          .filter((item) => item.type === 'CONTRIBUTIONS')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      finance:
        expenseItems
          .filter((item) => item.type === 'FINANCE')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      marketing:
        expenseItems
          .filter((item) => item.type === 'MARKETING')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      other:
        expenseItems
          .filter((item) => item.type === 'OTHER')
          .reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0,
      total: 0,
    };
    expense.total =
      expense.land +
      expense.construction +
      expense.design +
      expense.contributions +
      expense.finance +
      expense.marketing +
      expense.other;

    const profit = revenue.total - expense.total;
    const profitMargin = revenue.total > 0 ? (profit / revenue.total) * 100 : 0;

    // Calculate execution rate
    const totalExecuted = project.budgetItems.reduce(
      (sum, item) => sum + Number(item.executedAmount),
      0,
    );
    const totalBudget = project.budgetItems.reduce(
      (sum, item) => sum + Number(item.currentAmount),
      0,
    );
    const executionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

    // Format items with calculated fields
    const items = project.budgetItems.map((item) => ({
      ...item,
      initialAmount: Number(item.initialAmount),
      currentAmount: Number(item.currentAmount),
      executedAmount: Number(item.executedAmount),
      remainingAmount: Number(item.currentAmount) - Number(item.executedAmount),
      executionRate:
        Number(item.currentAmount) > 0
          ? (Number(item.executedAmount) / Number(item.currentAmount)) * 100
          : 0,
    }));

    return {
      projectId,
      revenue,
      expense,
      profit,
      profitMargin,
      executionRate,
      items,
    };
  }

  async getBudgetItems(projectId: string) {
    const items = await this.prisma.budgetItem.findMany({
      where: { projectId },
      include: {
        children: true,
        parent: true,
      },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      initialAmount: Number(item.initialAmount),
      currentAmount: Number(item.currentAmount),
      executedAmount: Number(item.executedAmount),
      remainingAmount: Number(item.currentAmount) - Number(item.executedAmount),
      executionRate:
        Number(item.currentAmount) > 0
          ? (Number(item.executedAmount) / Number(item.currentAmount)) * 100
          : 0,
    }));
  }

  async createBudgetItem(projectId: string, data: any) {
    const budgetItem = await this.prisma.budgetItem.create({
      data: {
        projectId,
        category: data.category,
        type: data.type,
        name: data.name,
        code: data.code,
        parentId: data.parentId,
        initialAmount: new Decimal(data.initialAmount),
        currentAmount: new Decimal(data.initialAmount),
        description: data.description,
      },
    });

    return {
      ...budgetItem,
      initialAmount: Number(budgetItem.initialAmount),
      currentAmount: Number(budgetItem.currentAmount),
      executedAmount: Number(budgetItem.executedAmount),
    };
  }

  async updateBudgetItem(projectId: string, itemId: string, data: any) {
    const item = await this.prisma.budgetItem.findFirst({
      where: { id: itemId, projectId },
    });

    if (!item) {
      throw new NotFoundException('Budget item not found');
    }

    // If currentAmount is being updated, create a budget change record
    if (data.currentAmount && data.currentAmount !== Number(item.currentAmount)) {
      const previousAmount = Number(item.currentAmount);
      const newAmount = Number(data.currentAmount);
      const changeAmount = newAmount - previousAmount;

      await this.prisma.budgetChange.create({
        data: {
          budgetItemId: itemId,
          previousAmount: new Decimal(previousAmount),
          newAmount: new Decimal(newAmount),
          changeAmount: new Decimal(changeAmount),
          reason: data.changeReason || 'Budget adjustment',
          approvedBy: data.approvedBy || 'system',
          approvedAt: new Date(),
        },
      });
    }

    const updatedItem = await this.prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        currentAmount: data.currentAmount
          ? new Decimal(data.currentAmount)
          : undefined,
        description: data.description,
      },
    });

    return {
      ...updatedItem,
      initialAmount: Number(updatedItem.initialAmount),
      currentAmount: Number(updatedItem.currentAmount),
      executedAmount: Number(updatedItem.executedAmount),
    };
  }

  async deleteBudgetItem(projectId: string, itemId: string) {
    const item = await this.prisma.budgetItem.findFirst({
      where: { id: itemId, projectId },
    });

    if (!item) {
      throw new NotFoundException('Budget item not found');
    }

    await this.prisma.budgetItem.delete({
      where: { id: itemId },
    });

    return { message: 'Budget item deleted successfully' };
  }

  async getBudgetChanges(projectId: string, itemId: string) {
    const changes = await this.prisma.budgetChange.findMany({
      where: {
        budgetItem: {
          id: itemId,
          projectId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return changes.map((change) => ({
      ...change,
      previousAmount: Number(change.previousAmount),
      newAmount: Number(change.newAmount),
      changeAmount: Number(change.changeAmount),
    }));
  }
}
