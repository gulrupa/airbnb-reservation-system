import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Min, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { IsDateOrDateString } from '../../../common/decorators/is-date-or-date-string.decorator';
import { TransformDate } from '../../../common/transformers/date.transformer';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Identifiant externe de la réservation (ex: ID Airbnb)',
    example: 'HMPSS2HE58',
    type: String,
  })
  @IsString()
  externalId: string;

  @ApiProperty({
    description: 'Prix de la réservation',
    example: 150.5,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Date de début de la réservation (format: YYYY-MM-DD ou ISO 8601)',
    example: '2025-12-21',
    type: String,
    format: 'date',
  })
  @TransformDate()
  @IsDateOrDateString()
  startDate: Date;

  @ApiProperty({
    description: 'Date de fin de la réservation (format: YYYY-MM-DD ou ISO 8601)',
    example: '2025-12-22',
    type: String,
    format: 'date',
  })
  @TransformDate()
  @IsDateOrDateString()
  endDate: Date;

  @ApiProperty({
    description: 'Nombre de voyageurs',
    example: 2,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  numberOfTravelers: number;

  @ApiProperty({
    description: 'Type de réservation',
    example: 'reservation',
    enum: ['reservation', 'manual_block_date'],
    required: false,
    default: 'reservation',
  })
  @IsOptional()
  @IsEnum(['reservation', 'manual_block_date'])
  type?: string;

  @ApiProperty({
    description: 'ID du calendrier associé (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  calendarUrlId?: string;
}

