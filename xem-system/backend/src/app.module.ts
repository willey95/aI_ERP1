import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { BudgetModule } from './budget/budget.module';
import { ExecutionModule } from './execution/execution.module';
import { ApprovalModule } from './approval/approval.module';
import { FinancialModule } from './financial/financial.module';
import { SimulationModule } from './simulation/simulation.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    BudgetModule,
    ExecutionModule,
    ApprovalModule,
    FinancialModule,
    SimulationModule,
    DashboardModule,
    UsersModule,
  ],
})
export class AppModule {}
