import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAiPromptDto {
  @ApiPropertyOptional({
    example: 'Bələdiyyə hadisələri platforması üzrə peşəkar köməkçi kimi cavab ver.',
    maxLength: 4000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  systemPrompt?: string;

  @ApiProperty({
    example: 'Bu dashboard dispetçerlərə necə kömək edir? İki cümlə ilə izah et.',
    maxLength: 4000,
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  userPrompt!: string;
}
