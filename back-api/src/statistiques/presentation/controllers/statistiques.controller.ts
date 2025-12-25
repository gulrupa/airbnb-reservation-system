import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { StatistiquesService } from '../../application/services/statistiques.service';

@ApiTags('statistiques')
@Controller('statistiques')
export class StatistiquesController {
  private readonly logger = new Logger(StatistiquesController.name);

  constructor(private readonly statistiquesService: StatistiquesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer les dernières statistiques',
    description: 'Retourne les statistiques calculées les plus récentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  async getStatistics() {
    this.logger.log('Récupération des statistiques');
    const stats = await this.statistiquesService.getLatestStatistics();
    if (!stats) {
      return {
        message: 'Aucune statistique disponible',
        data: null,
      };
    }
    return {
      message: 'Statistiques récupérées avec succès',
      data: stats,
    };
  }

  @Get('reservations/current-month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer les réservations du mois en cours',
    description: 'Retourne toutes les réservations valides du mois en cours',
  })
  @ApiResponse({
    status: 200,
    description: 'Réservations du mois récupérées avec succès',
  })
  async getCurrentMonthReservations() {
    this.logger.log('Récupération des réservations du mois en cours');
    const reservations = await this.statistiquesService.getCurrentMonthReservations();
    return {
      message: 'Réservations du mois récupérées avec succès',
      data: reservations,
      count: reservations.length,
    };
  }

  @Get('reservations/future')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer les réservations à venir',
    description: 'Retourne toutes les réservations valides futures (après aujourd\'hui)',
  })
  @ApiResponse({
    status: 200,
    description: 'Réservations futures récupérées avec succès',
  })
  async getFutureReservations() {
    this.logger.log('Récupération des réservations à venir');
    const reservations = await this.statistiquesService.getFutureReservations();
    return {
      message: 'Réservations futures récupérées avec succès',
      data: reservations,
      count: reservations.length,
    };
  }
}

