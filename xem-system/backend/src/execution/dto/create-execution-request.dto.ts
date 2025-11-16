import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateExecutionRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;

  @IsString()
  @IsNotEmpty({ message: 'Budget item ID is required' })
  budgetItemId: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @IsDateString({}, { message: 'Execution date must be a valid date string' })
  @IsNotEmpty({ message: 'Execution date is required' })
  executionDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Purpose is required' })
  @MaxLength(1000, { message: 'Purpose must not exceed 1000 characters' })
  purpose: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
