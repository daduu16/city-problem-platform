import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MinLength,
  Min,
  ValidateIf,
} from 'class-validator';

const categories = [
  'INFRASTRUCTURE',
  'UTILITIES',
  'GREENERY',
  'WEATHER_EMERGENCY',
  'SANITATION',
  'LIGHTING',
  'PARKS',
  'ADVERTISING',
  // Legacy mobile clients
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

  @ValidateIf((dto: CreateMobileProblemDto) => dto.lat !== undefined || dto.lng !== undefined)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ValidateIf((dto: CreateMobileProblemDto) => dto.lat !== undefined || dto.lng !== undefined)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

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
