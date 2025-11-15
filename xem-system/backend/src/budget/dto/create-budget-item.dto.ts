import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBudgetItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;

  @IsString()
  @IsNotEmpty({ message: 'Main item is required' })
  @MaxLength(100, { message: 'Main item must not exceed 100 characters' })
  mainItem: string;

  @IsString()
  @IsNotEmpty({ message: 'Sub item is required' })
  @MaxLength(100, { message: 'Sub item must not exceed 100 characters' })
  subItem: string;

  @IsNumber({}, { message: 'Initial budget must be a number' })
  @Min(0, { message: 'Initial budget must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Initial budget is required' })
  initialBudget: number;

  @IsNumber({}, { message: 'Current budget must be a number' })
  @Min(0, { message: 'Current budget must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Current budget is required' })
  currentBudget: number;
}
