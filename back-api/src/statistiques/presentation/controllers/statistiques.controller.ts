import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Query,
  ParseIntPipe,
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
    summary: 'Récupérer les statistiques',
    description: 'Retourne les statistiques pour une année donnée (ou année en cours par défaut)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  async getStatistics(@Query('year') year?: string) {
    const yearNumber = year ? parseInt(year, 10) : new Date().getFullYear();
    this.logger.log(`Récupération des statistiques pour l'année ${yearNumber}`);
    const stats = await this.statistiquesService.getStatisticsByYear(yearNumber);
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

  @Get('monthly/:year/:month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer les statistiques mensuelles',
    description: 'Retourne les statistiques pour un mois spécifique (month: 0-11)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques mensuelles récupérées avec succès',
  })
  async getMonthlyStatistics(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    this.logger.log(`Récupération des statistiques pour ${year}/${month}`);
    const stats = await this.statistiquesService.getMonthlyStatistics(year, month);
    if (!stats) {
      return {
        message: 'Aucune statistique disponible',
        data: null,
      };
    }
    return {
      message: 'Statistiques mensuelles récupérées avec succès',
      data: stats,
    };
  }

  @Get('years')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer les années disponibles',
    description: 'Retourne la liste des années pour lesquelles des statistiques existent',
  })
  @ApiResponse({
    status: 200,
    description: 'Années récupérées avec succès',
  })
  async getAvailableYears() {
    this.logger.log('Récupération des années disponibles');
    const years = await this.statistiquesService.getAvailableYears();
    return {
      message: 'Années récupérées avec succès',
      data: years,
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

  @Get('reservations/month/:year/:month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer les réservations d\'un mois spécifique',
    description: 'Retourne toutes les réservations valides d\'un mois et d\'une année donnés (month: 0-11)',
  })
  @ApiResponse({
    status: 200,
    description: 'Réservations du mois récupérées avec succès',
  })
  async getMonthReservations(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    this.logger.log(`Récupération des réservations pour ${year}/${month}`);
    const reservations = await this.statistiquesService.getMonthReservations(year, month);
    return {
      message: 'Réservations du mois récupérées avec succès',
      data: reservations,
      count: reservations.length,
    };
  }
}

