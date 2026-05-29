import { PartialType } from '@nestjs/swagger';
import { CreateIncidentDto } from './create-incident.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { IncidentStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;
}
