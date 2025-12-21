import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateCalendarUrlDto {
  @ApiPropertyOptional({
    description: 'URL du calendrier iCal',
    example: 'https://www.airbnb.fr/calendar/ical/123456789.ics?t=token',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

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

  @ApiPropertyOptional({
    description: 'Plateforme du calendrier',
    example: 'airbnb',
    enum: ['airbnb', 'booking', 'other'],
    type: String,
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Indique si le calendrier est actif',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

