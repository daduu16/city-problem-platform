import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class DayScheduleQueryDto {
  @ApiProperty({ description: 'Baku calendar date YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  draftStartsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  draftEndsAt?: string;
}
