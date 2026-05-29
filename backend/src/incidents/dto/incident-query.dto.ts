import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentPriority, IncidentStatus } from '@prisma/client';

export class IncidentQueryDto {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: IncidentPriority })
  @IsOptional()
  @IsEnum(IncidentPriority)
  priority?: IncidentPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class NearbyQueryDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional({ description: 'Radius in meters', default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  radiusMeters?: number = 1000;
}
