import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsMongoId, IsOptional } from 'class-validator';

export class UpdateAnnonceDto {
  @ApiPropertyOptional({
    description: 'Titre de l\'annonce',
    example: 'Appartement cosy au centre-ville',
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description de l\'annonce',
    example: 'Magnifique appartement de 50m² avec vue sur la ville',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Adresse de l\'annonce',
    example: '123 Rue de la Paix, 75001 Paris',
    type: String,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Liste des IDs des calendriers associés',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  calendarUrlIds?: string[];

  @ApiPropertyOptional({
    description: 'Liste des IDs des annonces qui bloquent cette annonce',
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  blockedByAnnonceIds?: string[];
}

