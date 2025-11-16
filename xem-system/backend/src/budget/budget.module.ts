import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { BudgetTransferController } from './budget-transfer.controller';
import { BudgetTransferService } from './budget-transfer.service';

@Module({
  controllers: [BudgetController, BudgetTransferController],
  providers: [BudgetService, BudgetTransferService],
  exports: [BudgetService, BudgetTransferService],
})
export class BudgetModule {}
