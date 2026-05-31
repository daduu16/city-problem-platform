import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  AssigneeAvailabilityKind,
  AssigneeAvailabilitySlotType,
} from '@prisma/client';

export class UpsertAvailabilitySlotDto {
  @IsEnum(AssigneeAvailabilityKind)
  kind!: AssigneeAvailabilityKind;

  @ValidateIf((o: UpsertAvailabilitySlotDto) => o.kind === AssigneeAvailabilityKind.WEEKLY)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ValidateIf((o: UpsertAvailabilitySlotDto) => o.kind === AssigneeAvailabilityKind.DATE)
  @IsString()
  date?: string;

  @IsEnum(AssigneeAvailabilitySlotType)
  slotType!: AssigneeAvailabilitySlotType;

  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute!: number;

  /** May equal startMinute for an explicit “closed day” marker (0–0). */
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute!: number;

  @IsOptional()
  @IsString()
  label?: string;
}
