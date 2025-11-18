import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkImportItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  @MaxLength(50, { message: 'Category must not exceed 50 characters' })
  category: string;

  @IsString()
  @IsNotEmpty({ message: 'Main item is required' })
  @MaxLength(100, { message: 'Main item must not exceed 100 characters' })
  mainItem: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Sub item must not exceed 100 characters' })
  subItem?: string;

  @IsNumber({}, { message: 'Budget amount must be a number' })
  @Min(0, { message: 'Budget amount must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Budget amount is required' })
  currentBudget: number;

  @IsString()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;
}

export class BulkImportBudgetDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => BulkImportItemDto)
  items: BulkImportItemDto[];
}
