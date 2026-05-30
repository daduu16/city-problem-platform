import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

const categories = [
  'SU',
  'QAZ',
  'ISIQ',
  'YOL',
  'ZIBIL',
  'QEZA',
  'TEBIET_HADISESI',
  'TEHLUKESIZLIK',
] as const;

const priorities = ['ASAGI', 'ORTA', 'YUKSEK', 'TECILI'] as const;

export class CreateMobileProblemDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(5)
  description!: string;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ValidateIf((dto: CreateMobileProblemDto) => Boolean(dto.mediaUrl))
  @IsIn(['image', 'video'])
  mediaType?: 'image' | 'video';

  @IsIn(categories)
  category!: (typeof categories)[number];

  @IsIn(priorities)
  priority!: (typeof priorities)[number];
}
