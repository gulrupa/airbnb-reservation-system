import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Min, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { IsDateOrDateString } from '../../../common/decorators/is-date-or-date-string.decorator';
import { TransformDate } from '../../../common/transformers/date.transformer';

export class UpdateReservationDto {
  @ApiPropertyOptional({
    description: 'Identifiant externe de la réservation',
    example: 'HMPSS2HE58',
    type: String,
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Prix de la réservation',
    example: 200.0,
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Date de début de la réservation (format: YYYY-MM-DD ou ISO 8601)',
    example: '2025-12-21',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @TransformDate()
  @IsDateOrDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Date de fin de la réservation (format: YYYY-MM-DD ou ISO 8601)',
    example: '2025-12-22',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @TransformDate()
  @IsDateOrDateString()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Nombre de voyageurs',
    example: 3,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  numberOfTravelers?: number;

  @ApiPropertyOptional({
    description: 'Type de réservation',
    example: 'reservation',
    enum: ['reservation', 'manual_block_date'],
  })
  @IsOptional()
  @IsEnum(['reservation', 'manual_block_date'])
  type?: string;

  @ApiPropertyOptional({
    description: 'ID du calendrier associé (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  calendarUrlId?: string;
}

