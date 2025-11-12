import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BudgetModule } from './modules/budget/budget.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SimulationModule } from './modules/simulation/simulation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    ProjectsModule,
    BudgetModule,
    ExecutionModule,
    ApprovalModule,
    AnalyticsModule,
    SimulationModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
