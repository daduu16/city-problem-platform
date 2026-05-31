import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryAssigneeKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import {
  emptyToUndefined,
  OptionalTrimmedString,
} from './assignee-field.transforms';

export class CreateAssigneeDto {
  @ApiProperty({ enum: CategoryAssigneeKind })
  @IsEnum(CategoryAssigneeKind)
  kind!: CategoryAssigneeKind;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @OptionalTrimmedString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(emptyToUndefined)
  @OptionalTrimmedString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @OptionalTrimmedString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(emptyToUndefined)
  organizationId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
