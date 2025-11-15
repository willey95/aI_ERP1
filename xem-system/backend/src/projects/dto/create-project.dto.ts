import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  @MaxLength(200, { message: 'Project name must not exceed 200 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Project code is required' })
  @MaxLength(50, { message: 'Project code must not exceed 50 characters' })
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  @MaxLength(100, { message: 'Department must not exceed 100 characters' })
  department: string;

  @IsDateString({}, { message: 'Invalid start date format' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @IsDateString({}, { message: 'Invalid end date format' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @IsEnum(ProjectStatus, { message: 'Invalid project status' })
  @IsOptional()
  status?: ProjectStatus;

  @IsNumber({}, { message: 'Total budget must be a number' })
  @Min(0, { message: 'Total budget must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Total budget is required' })
  totalBudget: number;
}
