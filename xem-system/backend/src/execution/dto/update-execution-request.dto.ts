import { PartialType } from '@nestjs/mapped-types';
import { CreateExecutionRequestDto } from './create-execution-request.dto';

export class UpdateExecutionRequestDto extends PartialType(CreateExecutionRequestDto) {}
