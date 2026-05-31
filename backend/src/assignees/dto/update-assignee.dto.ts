import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryAssigneeKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import {
  emptyToNull,
  OptionalTrimmedString,
} from './assignee-field.transforms';

export class UpdateAssigneeDto {
  @ApiPropertyOptional({ enum: CategoryAssigneeKind })
  @IsOptional()
  @IsEnum(CategoryAssigneeKind)
  kind?: CategoryAssigneeKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @OptionalTrimmedString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(emptyToNull)
  @OptionalTrimmedString()
  contactEmail?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @OptionalTrimmedString()
  contactPhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(emptyToNull)
  organizationId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
