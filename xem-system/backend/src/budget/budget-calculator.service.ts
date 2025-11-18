import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetCalculatorService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // FORMULA MANAGEMENT
  // ============================================

  async getFormulas(category?: string) {
    return this.prisma.budgetFormula.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getFormulaById(id: string) {
    const formula = await this.prisma.budgetFormula.findUnique({
      where: { id },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID ${id} not found`);
    }

    return formula;
  }

  async createFormula(data: {
    name: string;
    category: string;
    formula: string;
    description?: string;
    variables: string[];
  }) {
    return this.prisma.budgetFormula.create({
      data,
    });
  }

  async updateFormula(id: string, data: any) {
    return this.prisma.budgetFormula.update({
      where: { id },
      data,
    });
  }

  async deleteFormula(id: string) {
    return this.prisma.budgetFormula.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // CALCULATION OPERATIONS
  // ============================================

  async calculate(
    formulaId: string,
    projectId: string,
    variables: Record<string, number>,
    userId: string,
  ) {
    // Get formula
    const formula = await this.getFormulaById(formulaId);

    // Get project variables to merge
    const projectVars = await this.getProjectVariables(projectId);
    const allVariables = { ...projectVars, ...variables };

    // Calculate result
    const result = this.evaluateFormula(formula.formula, allVariables);

    return {
      formulaId,
      formula: formula.formula,
      variables: allVariables,
      result: new Decimal(result),
    };
  }

  async recalculateProject(projectId: string, userId: string) {
    // Get all calculable budget items
    const items = await this.prisma.budgetItem.findMany({
      where: {
        projectId,
        isCalculable: true,
        isActive: true,
        formulaId: { not: null },
      },
      include: {
        formula: true,
      },
    });

    // Get project variables
    const projectVarsArray = await this.prisma.projectVariable.findMany({
      where: { projectId },
    });

    const projectVars = projectVarsArray.reduce((acc, v) => {
      acc[v.name] = v.value.toNumber();
      return acc;
    }, {} as Record<string, number>);

    const results = [];

    // Recalculate each item
    for (const item of items) {
      if (!item.formula) continue;

      try {
        const result = this.evaluateFormula(item.formula.formula, projectVars);
        const calculatedAmount = new Decimal(result);

        // Update budget item
        await this.prisma.budgetItem.update({
          where: { id: item.id },
          data: {
            calculatedAmount,
            currentBudget: calculatedAmount,
            remainingBudget: calculatedAmount.minus(item.executedAmount),
          },
        });

        // Save to history
        await this.prisma.calculationHistory.create({
          data: {
            budgetItemId: item.id,
            formulaUsed: item.formula.formula,
            variables: projectVars,
            result: calculatedAmount,
            calculatedBy: userId,
          },
        });

        results.push({
          itemId: item.id,
          name: `${item.category} - ${item.mainItem}`,
          previousAmount: item.currentBudget,
          newAmount: calculatedAmount,
        });
      } catch (error) {
        console.error(`Error calculating item ${item.id}:`, error);
      }
    }

    // Update project totals
    await this.updateProjectTotals(projectId);

    return {
      projectId,
      itemsRecalculated: results.length,
      results,
    };
  }

  // ============================================
  // VARIABLE MANAGEMENT
  // ============================================

  async getProjectVariables(projectId: string): Promise<Record<string, number>> {
    const variables = await this.prisma.projectVariable.findMany({
      where: { projectId },
    });

    return variables.reduce((acc, v) => {
      acc[v.name] = v.value.toNumber();
      return acc;
    }, {} as Record<string, number>);
  }

  async updateProjectVariables(
    projectId: string,
    variables: Array<{ name: string; value: number; unit?: string; description?: string }>,
  ) {
    const results = [];

    for (const variable of variables) {
      const result = await this.prisma.projectVariable.upsert({
        where: {
          projectId_name: {
            projectId,
            name: variable.name,
          },
        },
        create: {
          projectId,
          name: variable.name,
          value: new Decimal(variable.value),
          unit: variable.unit,
          description: variable.description,
        },
        update: {
          value: new Decimal(variable.value),
          unit: variable.unit,
          description: variable.description,
        },
      });

      results.push(result);
    }

    return results;
  }

  // ============================================
  // BUDGET ITEM OPERATIONS
  // ============================================

  async getDetailedBudget(projectId: string) {
    const items = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
      include: {
        formula: true,
      },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    });

    // Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      projectId,
      categories: Object.keys(grouped).map((category) => ({
        name: category,
        items: grouped[category],
        total: {
          initialBudget: grouped[category].reduce(
            (sum, item) => sum.add(item.initialBudget),
            new Decimal(0),
          ),
          currentBudget: grouped[category].reduce(
            (sum, item) => sum.add(item.currentBudget),
            new Decimal(0),
          ),
          executedAmount: grouped[category].reduce(
            (sum, item) => sum.add(item.executedAmount),
            new Decimal(0),
          ),
          remainingBudget: grouped[category].reduce(
            (sum, item) => sum.add(item.remainingBudget),
            new Decimal(0),
          ),
        },
      })),
    };
  }

  async createCustomItem(data: {
    projectId: string;
    category: string;
    mainItem: string;
    subItem?: string;
    plannedAmount: number;
    isCalculable?: boolean;
    formulaId?: string;
  }) {
    const amount = new Decimal(data.plannedAmount);

    return this.prisma.budgetItem.create({
      data: {
        projectId: data.projectId,
        category: data.category,
        mainItem: data.mainItem,
        subItem: data.subItem,
        initialBudget: amount,
        currentBudget: amount,
        remainingBudget: amount,
        isCalculable: data.isCalculable || false,
        formulaId: data.formulaId,
      },
    });
  }

  async updateCustomItem(id: string, data: any) {
    return this.prisma.budgetItem.update({
      where: { id },
      data,
    });
  }

  async deleteCustomItem(id: string) {
    return this.prisma.budgetItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // ANALYSIS & REPORTING
  // ============================================

  async getCalculationHistory(budgetItemId: string) {
    return this.prisma.calculationHistory.findMany({
      where: { budgetItemId },
      orderBy: { calculatedAt: 'desc' },
      take: 50,
    });
  }

  async bulkUpdateItems(
    projectId: string,
    items: Array<{ id: string; currentBudget: number }>,
    userId: string,
  ) {
    const results = [];

    for (const item of items) {
      const updated = await this.prisma.budgetItem.update({
        where: { id: item.id },
        data: {
          currentBudget: new Decimal(item.currentBudget),
        },
      });
      results.push(updated);
    }

    await this.updateProjectTotals(projectId);

    return results;
  }

  async getBudgetComparison(projectId: string) {
    const items = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
      select: {
        id: true,
        category: true,
        mainItem: true,
        subItem: true,
        initialBudget: true,
        currentBudget: true,
        calculatedAmount: true,
        executedAmount: true,
        remainingBudget: true,
        executionRate: true,
      },
    });

    return {
      projectId,
      items: items.map((item) => ({
        ...item,
        variance: {
          plannedVsCalculated: item.calculatedAmount
            ? item.currentBudget.minus(item.calculatedAmount)
            : null,
          plannedVsActual: item.currentBudget.minus(item.executedAmount),
        },
      })),
      totals: {
        initialBudget: items.reduce((sum, item) => sum.add(item.initialBudget), new Decimal(0)),
        currentBudget: items.reduce((sum, item) => sum.add(item.currentBudget), new Decimal(0)),
        executedAmount: items.reduce((sum, item) => sum.add(item.executedAmount), new Decimal(0)),
        remainingBudget: items.reduce((sum, item) => sum.add(item.remainingBudget), new Decimal(0)),
      },
    };
  }

  async searchBudgetItems(projectId: string, query: string) {
    return this.prisma.budgetItem.findMany({
      where: {
        projectId,
        isActive: true,
        OR: [
          { mainItem: { contains: query, mode: 'insensitive' } },
          { subItem: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        formula: true,
      },
    });
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async createTemplate(data: { name: string; description?: string; structure: any }, userId: string) {
    return this.prisma.budgetTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        structure: data.structure,
        createdBy: userId,
      },
    });
  }

  async getTemplates() {
    return this.prisma.budgetTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyTemplate(templateId: string, projectId: string, userId: string) {
    const template = await this.prisma.budgetTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const structure = template.structure as any[];
    const createdItems = [];

    for (const item of structure) {
      const created = await this.prisma.budgetItem.create({
        data: {
          projectId,
          category: item.category,
          mainItem: item.mainItem,
          subItem: item.subItem,
          initialBudget: new Decimal(item.initialBudget || 0),
          currentBudget: new Decimal(item.currentBudget || 0),
          remainingBudget: new Decimal(item.remainingBudget || 0),
          isCalculable: item.isCalculable || false,
          formulaId: item.formulaId,
          displayOrder: item.displayOrder || 0,
        },
      });
      createdItems.push(created);
    }

    await this.updateProjectTotals(projectId);

    return {
      templateId,
      projectId,
      itemsCreated: createdItems.length,
      items: createdItems,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private evaluateFormula(formula: string, variables: Record<string, number>): number {
    try {
      // Replace variable names with values
      let expression = formula;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, value.toString());
      }

      // Evaluate the expression safely
      // WARNING: This is a simple implementation. For production, use a proper math expression parser
      // like mathjs or expr-eval to prevent code injection
      const result = Function(`"use strict"; return (${expression})`)();

      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Formula evaluation did not return a valid number');
      }

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Formula evaluation failed: ${error.message}. Formula: ${formula}`,
      );
    }
  }

  private async updateProjectTotals(projectId: string) {
    const items = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
    });

    const totalInitial = items.reduce((sum, item) => sum.add(item.initialBudget), new Decimal(0));
    const totalCurrent = items.reduce((sum, item) => sum.add(item.currentBudget), new Decimal(0));
    const totalExecuted = items.reduce((sum, item) => sum.add(item.executedAmount), new Decimal(0));
    const totalRemaining = totalCurrent.minus(totalExecuted);
    const executionRate = totalCurrent.toNumber() > 0
      ? (totalExecuted.toNumber() / totalCurrent.toNumber()) * 100
      : 0;

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        initialBudget: totalInitial,
        currentBudget: totalCurrent,
        executedAmount: totalExecuted,
        remainingBudget: totalRemaining,
        executionRate,
      },
    });
  }
}
