import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BudgetExcelService } from './budget-excel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('budget/excel')
@UseGuards(JwtAuthGuard)
export class BudgetExcelController {
  constructor(private readonly budgetExcelService: BudgetExcelService) {}

  /**
   * Export project budget to Excel file
   * GET /budget/excel/export/:projectId
   */
  @Get('export/:projectId')
  async exportBudget(@Param('projectId') projectId: string, @Res() res: Response) {
    try {
      const buffer = await this.budgetExcelService.exportBudgetToExcel(projectId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=budget_${projectId}_${Date.now()}.xlsx`);

      return res.send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to export budget',
      });
    }
  }

  /**
   * Export blank budget template
   * GET /budget/excel/template
   */
  @Get('template')
  async exportTemplate(@Res() res: Response) {
    try {
      const buffer = await this.budgetExcelService.exportTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=budget_template_${Date.now()}.xlsx`);

      return res.send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to export template',
      });
    }
  }

  /**
   * Import budget items from Excel file
   * POST /budget/excel/import/:projectId
   */
  @Post('import/:projectId')
  @UseInterceptors(FileInterceptor('file'))
  async importBudget(
    @Param('projectId') projectId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only Excel files (.xlsx, .xls) are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      const result = await this.budgetExcelService.importBudgetFromExcel(projectId, file.buffer);

      return {
        success: result.errors.length === 0,
        created: result.created,
        errors: result.errors,
        message:
          result.errors.length === 0
            ? `Successfully imported ${result.created} budget items`
            : `Import completed with errors. ${result.created} items created.`,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to import budget items');
    }
  }
}
