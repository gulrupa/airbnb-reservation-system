import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';
import { AnnonceService } from '../../application/services/annonce.service';
import { CreateAnnonceDto } from '../../application/dto/create-annonce.dto';
import { UpdateAnnonceDto } from '../../application/dto/update-annonce.dto';

@ApiTags('annonces')
@Controller('annonces')
@Roles('admin')
export class AnnonceController {
  private readonly logger = new Logger(AnnonceController.name);

  constructor(private readonly annonceService: AnnonceService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer toutes les annonces' })
  @ApiResponse({
    status: 200,
    description: 'Liste de toutes les annonces',
  })
  async getAllAnnonces() {
    return this.annonceService.getAllAnnonces();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer une annonce par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({
    status: 200,
    description: 'Annonce trouvée',
  })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async getAnnonceById(@Param('id') id: string) {
    return this.annonceService.getAnnonceById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle annonce' })
  @ApiBody({ type: CreateAnnonceDto })
  @ApiResponse({
    status: 201,
    description: 'Annonce créée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createAnnonce(@Body() createAnnonceDto: CreateAnnonceDto) {
    return this.annonceService.createAnnonce(createAnnonceDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiBody({ type: UpdateAnnonceDto })
  @ApiResponse({
    status: 200,
    description: 'Annonce mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async updateAnnonce(
    @Param('id') id: string,
    @Body() updateAnnonceDto: UpdateAnnonceDto,
  ) {
    return this.annonceService.updateAnnonce(id, updateAnnonceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une annonce' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({
    status: 200,
    description: 'Annonce supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Annonce supprimée avec succès' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async deleteAnnonce(@Param('id') id: string) {
    await this.annonceService.deleteAnnonce(id);
    return { message: 'Annonce supprimée avec succès' };
  }

  @Get(':id/is-blocked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier si une annonce est bloquée par d\'autres annonces' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({
    status: 200,
    description: 'Statut de blocage de l\'annonce',
    schema: {
      type: 'object',
      properties: {
        isBlocked: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async isBlockedByAnnonces(@Param('id') id: string) {
    const isBlocked = await this.annonceService.isBlockedByAnnonces(id);
    return { isBlocked };
  }

  @Get(':id/unavailabilities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer toutes les indisponibilités (réservations) liées à une annonce',
    description:
      'Retourne toutes les réservations des calendriers de l\'annonce ainsi que les réservations des calendriers des annonces qui bloquent cette annonce',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({
    status: 200,
    description: 'Liste de toutes les réservations (indisponibilités) liées à l\'annonce',
  })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async getUnavailabilities(@Param('id') id: string) {
    return this.annonceService.getUnavailabilities(id);
  }
}

