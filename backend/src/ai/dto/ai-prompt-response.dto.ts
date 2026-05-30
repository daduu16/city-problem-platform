import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiPromptResponseDto {
  @ApiProperty({
    example: 'The dashboard shows incident KPIs, trends, and geographic hot zones.',
  })
  answer!: string;

  @ApiProperty({ example: 'openai/gpt-oss-120b' })
  model!: string;

  @ApiPropertyOptional({ example: 'chatcmpl_abc123' })
  completionId?: string;
}
