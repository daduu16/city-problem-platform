import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentAssigneeTaskScheduleType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateIncidentTaskDto {
  @ApiProperty()
  @IsUUID()
  assigneeId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiProperty()
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ enum: IncidentAssigneeTaskScheduleType, default: 'FIXED' })
  @IsOptional()
  @IsEnum(IncidentAssigneeTaskScheduleType)
  scheduleType?: IncidentAssigneeTaskScheduleType;

  @ApiPropertyOptional({ description: 'Approximate effort for WINDOW tasks (minutes)' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(24 * 60)
  estimatedMinutes?: number;

  @ApiPropertyOptional({
    description: 'Allow FIXED slot despite overlap with other FIXED tasks',
  })
  @IsOptional()
  @IsBoolean()
  allowOverlap?: boolean;
}
