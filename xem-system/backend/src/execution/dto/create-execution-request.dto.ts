import {
  IsString,
  IsNotEmpty,
  IsNumber,
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

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'Request reason is required' })
  @MaxLength(1000, { message: 'Request reason must not exceed 1000 characters' })
  requestReason: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Attachment URL must not exceed 500 characters' })
  attachmentUrl?: string;
}
