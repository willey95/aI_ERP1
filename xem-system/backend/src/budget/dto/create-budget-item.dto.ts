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
  @IsNotEmpty({ message: 'Category is required' })
  @MaxLength(50, { message: 'Category must not exceed 50 characters' })
  category: string;

  @IsString()
  @IsNotEmpty({ message: 'Main item is required' })
  @MaxLength(100, { message: 'Main item must not exceed 100 characters' })
  mainItem: string;

  @IsString()
  @IsNotEmpty({ message: 'Sub item is required' })
  @MaxLength(100, { message: 'Sub item must not exceed 100 characters' })
  subItem: string;

  @IsNumber({}, { message: 'Budget amount must be a number' })
  @Min(0, { message: 'Budget amount must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Budget amount is required' })
  currentBudget: number;
}
