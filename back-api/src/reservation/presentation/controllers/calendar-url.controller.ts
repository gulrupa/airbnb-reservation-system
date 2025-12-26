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
  Query,
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
import { Roles } from 'nest-keycloak-connect';
import { CalendarUrlService } from '../../application/services/calendar-url.service';
import { CalendarSyncService } from '../../application/services/calendar-sync.service';
import { CreateCalendarUrlDto } from '../../application/dto/create-calendar-url.dto';
import { UpdateCalendarUrlDto } from '../../application/dto/update-calendar-url.dto';

@ApiTags('calendar-urls')
@Controller('calendar-urls')
@Roles('admin')
export class CalendarUrlController {
  private readonly logger = new Logger(CalendarUrlController.name);

  constructor(
    private readonly calendarUrlService: CalendarUrlService,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer toutes les URLs de calendrier' })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Filtrer par plateforme (airbnb, booking, etc.)',
    enum: ['airbnb', 'booking', 'other'],
  })
  @ApiResponse({
    status: 200,
    description: 'Liste de toutes les URLs de calendrier',
  })
  async getAllCalendarUrls(@Query('platform') platform?: string) {
    if (platform) {
      return this.calendarUrlService.getCalendarUrlsByPlatform(platform);
    }
    return this.calendarUrlService.getAllCalendarUrls();
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer uniquement les URLs de calendrier actives' })
  @ApiResponse({
    status: 200,
    description: 'Liste des URLs de calendrier actives',
  })
  async getActiveCalendarUrls() {
    return this.calendarUrlService.getActiveCalendarUrls();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer une URL de calendrier par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'URL de calendrier' })
  @ApiResponse({
    status: 200,
    description: 'URL de calendrier trouvée',
  })
  @ApiResponse({ status: 404, description: 'URL de calendrier non trouvée' })
  async getCalendarUrlById(@Param('id') id: string) {
    return this.calendarUrlService.getCalendarUrlById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle URL de calendrier' })
  @ApiBody({ type: CreateCalendarUrlDto })
  @ApiResponse({
    status: 201,
    description: 'URL de calendrier créée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'URL de calendrier existe déjà' })
  async createCalendarUrl(@Body() createCalendarUrlDto: CreateCalendarUrlDto) {
    this.logger.debug('Creating calendar URL', createCalendarUrlDto);
    try {
      const result = await this.calendarUrlService.createCalendarUrl(createCalendarUrlDto);
      this.logger.log(`Calendar URL created successfully: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error('Error creating calendar URL', error.stack);
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une URL de calendrier' })
  @ApiParam({ name: 'id', description: 'ID de l\'URL de calendrier' })
  @ApiBody({ type: UpdateCalendarUrlDto })
  @ApiResponse({
    status: 200,
    description: 'URL de calendrier mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'URL de calendrier non trouvée' })
  @ApiResponse({ status: 409, description: 'URL de calendrier existe déjà' })
  async updateCalendarUrl(
    @Param('id') id: string,
    @Body() updateCalendarUrlDto: UpdateCalendarUrlDto,
  ) {
    this.logger.debug(`Updating calendar URL ${id}`, updateCalendarUrlDto);
    try {
      const result = await this.calendarUrlService.updateCalendarUrl(id, updateCalendarUrlDto);
      this.logger.log(`Calendar URL updated successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating calendar URL ${id}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une URL de calendrier' })
  @ApiParam({ name: 'id', description: 'ID de l\'URL de calendrier' })
  @ApiResponse({
    status: 200,
    description: 'URL de calendrier supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'URL de calendrier supprimée avec succès' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'URL de calendrier non trouvée' })
  async deleteCalendarUrl(@Param('id') id: string) {
    await this.calendarUrlService.deleteCalendarUrl(id);
    return { message: 'URL de calendrier supprimée avec succès' };
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchroniser manuellement tous les calendriers actifs' })
  @ApiResponse({
    status: 200,
    description: 'Synchronisation lancée avec succès',
  })
  async syncAllCalendars() {
    this.logger.log('Synchronisation manuelle déclenchée');
    await this.calendarSyncService.syncAllCalendars();
    return { message: 'Synchronisation terminée' };
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchroniser un calendrier spécifique' })
  @ApiParam({ name: 'id', description: 'ID de l\'URL de calendrier' })
  @ApiResponse({
    status: 200,
    description: 'Synchronisation du calendrier lancée avec succès',
  })
  @ApiResponse({ status: 404, description: 'URL de calendrier non trouvée' })
  async syncCalendar(@Param('id') id: string) {
    const calendarUrl = await this.calendarUrlService.getCalendarUrlById(id);
    this.logger.log(`Synchronisation manuelle du calendrier ${id} déclenchée`);
    const result = await this.calendarSyncService.syncCalendar(
      id,
      calendarUrl.url,
      calendarUrl.platform,
    );
    return {
      message: 'Synchronisation terminée',
      created: result.created,
      updated: result.updated,
    };
  }
}

