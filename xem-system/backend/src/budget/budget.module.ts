import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { BudgetTransferController } from './budget-transfer.controller';
import { BudgetTransferService } from './budget-transfer.service';
import { BudgetCalculatorController } from './budget-calculator.controller';
import { BudgetCalculatorService } from './budget-calculator.service';
import { BudgetExcelController } from './budget-excel.controller';
import { BudgetExcelService } from './budget-excel.service';

@Module({
  controllers: [
    BudgetController,
    BudgetTransferController,
    BudgetCalculatorController,
    BudgetExcelController,
  ],
  providers: [
    BudgetService,
    BudgetTransferService,
    BudgetCalculatorService,
    BudgetExcelService,
  ],
  exports: [
    BudgetService,
    BudgetTransferService,
    BudgetCalculatorService,
    BudgetExcelService,
  ],
})
export class BudgetModule {}
