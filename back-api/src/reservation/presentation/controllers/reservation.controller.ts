import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ReservationService } from '../../application/services/reservation.service';
import { CreateReservationDto } from '../../application/dto/create-reservation.dto';
import { UpdateReservationDto } from '../../application/dto/update-reservation.dto';
import { AirbnbCalendarService } from '../../application/services/airbnb/airbnb-calendar.service';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);

  constructor(
    private readonly reservationService: ReservationService,
    private readonly airbnbCalendarService: AirbnbCalendarService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer toutes les réservations' })
  @ApiResponse({
    status: 200,
    description: 'Liste de toutes les réservations',
  })
  async getAllReservations() {
    return this.reservationService.getAllReservations();
  }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle réservation' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({
    status: 201,
    description: 'Réservation créée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Réservation avec cet externalId existe déjà' })
  async createReservation(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.createReservation(createReservationDto);
  }

  @Get('future')
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
    const reservations = await this.reservationService.getFutureReservations();
    return {
      message: 'Réservations futures récupérées avec succès',
      data: reservations,
      count: reservations.length,
    };
  }
  
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer une réservation par ID' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiResponse({
    status: 200,
    description: 'Réservation trouvée',
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  async getReservationById(@Param('id') id: string) {
    return this.reservationService.getReservationById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une réservation' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({
    status: 200,
    description: 'Réservation mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  async updateReservation(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationService.updateReservation(id, updateReservationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une réservation' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiResponse({
    status: 200,
    description: 'Réservation supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Réservation supprimée avec succès' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  async deleteReservation(@Param('id') id: string) {
    await this.reservationService.deleteReservation(id);
    return { message: 'Réservation supprimée avec succès' };
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer les réservations d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations de l\'utilisateur',
  })
  async getReservationsByUserId(@Param('userId') userId: string) {
    return this.reservationService.getReservationsByUserId(userId);
  }

  @Get('property/:propertyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer les réservations d\'une propriété' })
  @ApiParam({ name: 'propertyId', description: 'ID de la propriété' })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations de la propriété',
  })
  async getReservationsByPropertyId(@Param('propertyId') propertyId: string) {
    return this.reservationService.getReservationsByPropertyId(propertyId);
  }

  @Get('date-range/start/:startDate/end/:endDate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer les réservations dans une plage de dates' })
  @ApiParam({ name: 'startDate', description: 'Date de début (ISO 8601)' })
  @ApiParam({ name: 'endDate', description: 'Date de fin (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations dans la plage de dates',
  })
  async getReservationsByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    return this.reservationService.getReservationsByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('airbnb/calendar')
  @HttpCode(HttpStatus.OK)
  @ApiTags('airbnb')
  @ApiOperation({ summary: 'Récupérer les réservations depuis un calendrier Airbnb' })
  @ApiQuery({ name: 'url', description: 'URL du calendrier iCal Airbnb', required: true })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations extraites du calendrier Airbnb',
  })
  @ApiResponse({ status: 400, description: 'URL invalide ou manquante' })
  async fetchAirbnbCalendar(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('L\'URL du calendrier est requise');
    }
    return this.airbnbCalendarService.fetchReservations(url);
  }

  @Get('calendar/:calendarUrlId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer les réservations d\'un calendrier' })
  @ApiParam({ name: 'calendarUrlId', description: 'ID du calendrier' })
  @ApiResponse({
    status: 200,
    description: 'Liste des réservations du calendrier',
  })
  async getReservationsByCalendarUrlId(@Param('calendarUrlId') calendarUrlId: string) {
    return this.reservationService.getReservationsByCalendarUrlId(calendarUrlId);
  }
}

