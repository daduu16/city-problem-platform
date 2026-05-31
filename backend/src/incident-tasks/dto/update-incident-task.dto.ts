import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IncidentAssigneeTaskScheduleType,
  IncidentAssigneeTaskStatus,
} from '@prisma/client';
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

export class UpdateIncidentTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ enum: IncidentAssigneeTaskScheduleType })
  @IsOptional()
  @IsEnum(IncidentAssigneeTaskScheduleType)
  scheduleType?: IncidentAssigneeTaskScheduleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(24 * 60)
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowOverlap?: boolean;

  @ApiPropertyOptional({ enum: IncidentAssigneeTaskStatus })
  @IsOptional()
  @IsEnum(IncidentAssigneeTaskStatus)
  status?: IncidentAssigneeTaskStatus;
}
