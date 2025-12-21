import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateCalendarUrlDto {
  @ApiProperty({
    description: 'URL du calendrier iCal',
    example: 'https://www.airbnb.fr/calendar/ical/123456789.ics?t=token',
    type: String,
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Nom du calendrier',
    example: 'Mon calendrier Airbnb',
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description du calendrier',
    example: 'Calendrier principal de ma propriété',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Plateforme du calendrier',
    example: 'airbnb',
    enum: ['airbnb', 'booking', 'other'],
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiPropertyOptional({
    description: 'Indique si le calendrier est actif',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

