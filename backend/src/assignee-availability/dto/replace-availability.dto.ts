import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { UpsertAvailabilitySlotDto } from './upsert-availability-slot.dto';

export class ReplaceAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertAvailabilitySlotDto)
  slots!: UpsertAvailabilitySlotDto[];
}
