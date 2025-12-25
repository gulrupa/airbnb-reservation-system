import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CalendarSyncService } from './reservation/application/services/calendar-sync.service';
import { EmailSyncService } from './evenement/application/services/email-sync.service';
import { EventProcessorService } from './reservation/application/services/event-processor.service';
import { StatistiquesService } from './statistiques/application/services/statistiques.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly emailSyncService: EmailSyncService,
    private readonly eventProcessorService: EventProcessorService,
    private readonly statistiquesService: StatistiquesService,
  ) {}

  @Post('calendar-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclencher manuellement la synchronisation des calendriers',
    description: 'Lance la synchronisation de tous les calendriers actifs',
  })
  @ApiResponse({
    status: 200,
    description: 'Synchronisation lancée avec succès',
  })
  async triggerCalendarSync(): Promise<{ message: string }> {
    this.logger.log('Déclenchement manuel de la synchronisation des calendriers');
    await this.calendarSyncService.syncAllCalendars();
    return { message: 'Synchronisation des calendriers lancée avec succès' };
  }

  @Post('email-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclencher manuellement la synchronisation des emails Airbnb',
    description: 'Lance la récupération et le traitement des emails Airbnb',
  })
  @ApiResponse({
    status: 200,
    description: 'Synchronisation des emails lancée avec succès',
  })
  async triggerEmailSync(): Promise<{ message: string }> {
    this.logger.log('Déclenchement manuel de la synchronisation des emails');
    await this.emailSyncService.syncEmails();
    return { message: 'Synchronisation des emails lancée avec succès' };
  }

  @Post('event-processor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclencher manuellement le traitement des événements',
    description: 'Lance le traitement des événements non traités pour mettre à jour les réservations',
  })
  @ApiResponse({
    status: 200,
    description: 'Traitement des événements lancé avec succès',
  })
  async triggerEventProcessor(): Promise<{ message: string }> {
    this.logger.log('Déclenchement manuel du traitement des événements');
    await this.eventProcessorService.processEvents();
    return { message: 'Traitement des événements lancé avec succès' };
  }

  @Post('statistiques')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclencher manuellement le calcul des statistiques',
    description: 'Lance le calcul et la sauvegarde des statistiques',
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul des statistiques lancé avec succès',
  })
  async triggerStatistiques(): Promise<{ message: string }> {
    this.logger.log('Déclenchement manuel du calcul des statistiques');
    await this.statistiquesService.calculateAndSaveStatistics();
    return { message: 'Calcul des statistiques lancé avec succès' };
  }
}

