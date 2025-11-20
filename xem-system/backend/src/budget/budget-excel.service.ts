import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetExcelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export project budget items to Excel file
   */
  async exportBudgetToExcel(projectId: string): Promise<Buffer> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Fetch budget items
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { mainItem: 'asc' },
        { subItem: 'asc' },
      ],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('예산 항목');

    // Set column headers
    worksheet.columns = [
      { header: '카테고리', key: 'category', width: 20 },
      { header: '대항목', key: 'mainItem', width: 30 },
      { header: '세부항목', key: 'subItem', width: 30 },
      { header: '예산액 (원)', key: 'currentBudget', width: 20 },
      { header: '집행액 (원)', key: 'executedAmount', width: 20 },
      { header: '잔액 집행전 (원)', key: 'remainingBeforeExec', width: 20 },
      { header: '잔액 집행후 (원)', key: 'remainingAfterExec', width: 20 },
      { header: '집행 예정액 (원)', key: 'pendingExecutionAmount', width: 20 },
      { header: '집행률 (%)', key: 'executionRate', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    budgetItems.forEach((item) => {
      const currentBudget = this.decimalToNumber(item.currentBudget);
      const executedAmount = this.decimalToNumber(item.executedAmount);
      const remainingBeforeExec = this.decimalToNumber(item.remainingBeforeExec);
      const remainingAfterExec = this.decimalToNumber(item.remainingAfterExec);
      const pendingExecutionAmount = this.decimalToNumber(item.pendingExecutionAmount);
      const executionRate = this.decimalToNumber(item.executionRate);

      worksheet.addRow({
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        currentBudget,
        executedAmount,
        remainingBeforeExec,
        remainingAfterExec,
        pendingExecutionAmount,
        executionRate,
      });
    });

    // Format number columns
    const numberColumns = ['D', 'E', 'F', 'G', 'H']; // currentBudget, executedAmount, remainingBeforeExec, remainingAfterExec, pendingExecutionAmount
    numberColumns.forEach((col) => {
      worksheet.getColumn(col).numFmt = '#,##0';
      worksheet.getColumn(col).alignment = { horizontal: 'right' };
    });

    // Format percentage column
    worksheet.getColumn('I').numFmt = '0.00';
    worksheet.getColumn('I').alignment = { horizontal: 'right' };

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add summary row
    const summaryRowNum = worksheet.rowCount + 2;
    const summaryRow = worksheet.getRow(summaryRowNum);
    summaryRow.getCell(1).value = '합계';
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(4).value = { formula: `SUM(D2:D${worksheet.rowCount})` };
    summaryRow.getCell(5).value = { formula: `SUM(E2:E${worksheet.rowCount})` };
    summaryRow.getCell(6).value = { formula: `SUM(F2:F${worksheet.rowCount})` };
    summaryRow.getCell(7).value = { formula: `SUM(G2:G${worksheet.rowCount})` };
    summaryRow.getCell(8).value = { formula: `SUM(H2:H${worksheet.rowCount})` };
    summaryRow.getCell(9).value = {
      formula: `IF(D${summaryRowNum}=0,0,E${summaryRowNum}/D${summaryRowNum}*100)`,
    };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    summaryRow.font = { bold: true };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export blank budget template for project
   */
  async exportTemplate(projectId?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('예산 템플릿');

    // Set column headers
    worksheet.columns = [
      { header: '카테고리', key: 'category', width: 20 },
      { header: '대항목', key: 'mainItem', width: 30 },
      { header: '세부항목', key: 'subItem', width: 30 },
      { header: '예산액 (원)', key: 'currentBudget', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add example rows
    const exampleData = [
      { category: '인건비', mainItem: '급여', subItem: '정규직 급여', currentBudget: 50000000 },
      { category: '인건비', mainItem: '급여', subItem: '계약직 급여', currentBudget: 30000000 },
      { category: '재료비', mainItem: '원자재', subItem: '철근', currentBudget: 100000000 },
      { category: '재료비', mainItem: '원자재', subItem: '시멘트', currentBudget: 80000000 },
    ];

    exampleData.forEach((row) => {
      worksheet.addRow(row);
    });

    // Format number column
    worksheet.getColumn('D').numFmt = '#,##0';
    worksheet.getColumn('D').alignment = { horizontal: 'right' };

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add instruction sheet
    const instructionSheet = workbook.addWorksheet('사용 안내');
    instructionSheet.getCell('A1').value = '예산 임포트 사용 안내';
    instructionSheet.getCell('A1').font = { bold: true, size: 14 };
    instructionSheet.getCell('A3').value = '1. "예산 템플릿" 시트에 예산 항목을 입력하세요.';
    instructionSheet.getCell('A4').value = '2. 카테고리, 대항목, 세부항목, 예산액은 필수 입력 사항입니다.';
    instructionSheet.getCell('A5').value = '3. 예산액은 숫자만 입력 가능합니다.';
    instructionSheet.getCell('A6').value = '4. 예산액은 0보다 큰 값이어야 합니다.';
    instructionSheet.getCell('A7').value = '5. 작성 완료 후 파일을 저장하고 업로드하세요.';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Import budget items from Excel file
   */
  async importBudgetFromExcel(projectId: string, fileBuffer: Buffer): Promise<{ created: number; errors: string[] }> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const worksheet = workbook.getWorksheet('예산 템플릿') || workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('No valid worksheet found in Excel file');
    }

    const errors: string[] = [];
    const itemsToCreate: Array<{
      projectId: string;
      category: string;
      mainItem: string;
      subItem: string;
      currentBudget: number;
    }> = [];

    // Skip header row, start from row 2
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const category = row.getCell(1).value?.toString().trim();
        const mainItem = row.getCell(2).value?.toString().trim();
        const subItem = row.getCell(3).value?.toString().trim();
        const budgetValue = row.getCell(4).value;

        // Skip empty rows
        if (!category && !mainItem && !subItem && !budgetValue) {
          return;
        }

        // Validation
        if (!category || !mainItem || !subItem) {
          errors.push(`Row ${rowNumber}: Missing required fields (category, mainItem, or subItem)`);
          return;
        }

        let currentBudget: number;
        if (typeof budgetValue === 'number') {
          currentBudget = budgetValue;
        } else if (budgetValue && typeof budgetValue === 'object' && 'result' in budgetValue) {
          // Handle formula results
          currentBudget = (budgetValue as any).result;
        } else {
          const parsed = parseFloat(budgetValue?.toString() || '0');
          if (isNaN(parsed)) {
            errors.push(`Row ${rowNumber}: Invalid budget amount`);
            return;
          }
          currentBudget = parsed;
        }

        if (currentBudget <= 0) {
          errors.push(`Row ${rowNumber}: Budget amount must be greater than 0`);
          return;
        }

        if (currentBudget > 1000000000000) {
          errors.push(`Row ${rowNumber}: Budget amount exceeds 1 trillion won limit`);
          return;
        }

        itemsToCreate.push({
          projectId,
          category,
          mainItem,
          subItem,
          currentBudget,
        });
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    });

    // If there are validation errors, return them without creating items
    if (errors.length > 0) {
      return { created: 0, errors };
    }

    // Create budget items in transaction
    let created = 0;
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of itemsToCreate) {
          await tx.budgetItem.create({
            data: {
              ...item,
              initialBudget: item.currentBudget,
              executedAmount: 0,
              remainingBeforeExec: item.currentBudget,
              remainingAfterExec: item.currentBudget,
              pendingExecutionAmount: 0,
              executionRate: 0,
              isActive: true,
            },
          });
          created++;
        }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create budget items: ${error.message}`);
    }

    return { created, errors };
  }

  /**
   * Helper: Convert Prisma Decimal to number
   */
  private decimalToNumber(decimal: Decimal | number): number {
    if (typeof decimal === 'number') return decimal;
    return parseFloat(decimal.toString());
  }
}
