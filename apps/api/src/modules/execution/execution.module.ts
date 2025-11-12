import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService, PrismaService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
