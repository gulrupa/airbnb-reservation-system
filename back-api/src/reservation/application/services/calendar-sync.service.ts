import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CalendarUrlService } from './calendar-url.service';
import { ReservationService } from './reservation.service';
import { AirbnbCalendarService } from './airbnb/airbnb-calendar.service';
import { Reservation } from '../../domain/entities/reservation.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { ReservationDocument } from '../../infrastructure/database/schemas/reservation.schema';

@Injectable()
export class CalendarSyncService implements OnModuleInit {
  private readonly logger = new Logger(CalendarSyncService.name);
  private readonly CRON_JOB_NAME = 'calendar-sync';

  constructor(
    private readonly calendarUrlService: CalendarUrlService,
    private readonly reservationService: ReservationService,
    private readonly airbnbCalendarService: AirbnbCalendarService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'CALENDAR_SYNC_CRON',
      '0 * * * *',
    );

    this.logger.log(
      `Configuration du cron job de synchronisation avec l'expression: ${cronExpression}`,
    );

    const job = new CronJob(cronExpression, () => {
      this.handleCronSync();
    });

    this.schedulerRegistry.addCronJob(this.CRON_JOB_NAME, job);
    job.start();

    this.logger.log(
      `Cron job de synchronisation démarré avec l'expression: ${cronExpression}`,
    );
  }

  async handleCronSync() {
    this.logger.log('Démarrage de la synchronisation des calendriers');
    
    try {
      const activeCalendarUrls = await this.calendarUrlService.getActiveCalendarUrls();
      this.logger.log(`${activeCalendarUrls.length} calendrier(s) actif(s) à synchroniser`);

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      for (const calendarUrl of activeCalendarUrls) {
        try {
          const result = await this.syncCalendar(
            calendarUrl._id.toString(),
            calendarUrl.url,
            calendarUrl.platform,
          );
          totalCreated += result.created;
          totalUpdated += result.updated;
          totalErrors += result.errors;
        } catch (error) {
          totalErrors++;
          this.logger.error(
            `Erreur lors de la synchronisation du calendrier ${calendarUrl.url}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Synchronisation terminée: ${totalCreated} créée(s), ${totalUpdated} mise(s) à jour, ${totalErrors} erreur(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation des calendriers: ${error.message}`,
        error.stack,
      );
    }
  }

  async syncAllCalendars() {
    return this.handleCronSync();
  }

  async syncCalendar(
    calendarUrlId: string,
    url: string,
    platform: string,
  ): Promise<{ created: number; updated: number; errors: number }> {
    this.logger.debug(`Synchronisation du calendrier: ${url} (ID: ${calendarUrlId})`);

    if (platform !== 'airbnb') {
      this.logger.warn(`Plateforme ${platform} non supportée pour le moment`);
      return { created: 0, updated: 0, errors: 0 };
    }

    let errors = 0;

    try {
      const reservations = await this.airbnbCalendarService.fetchReservations(url);
      this.logger.debug(`${reservations.length} réservation(s) trouvée(s) dans le calendrier`);

      let created = 0;
      let updated = 0;

      for (const reservation of reservations) {
        try {
          const existingReservation =
            await this.reservationService.getReservationByExternalId(
              reservation.externalId,
            );

          if (existingReservation) {
            await this.updateReservationIfNeeded(
              existingReservation,
              reservation,
              calendarUrlId,
            );
            updated++;
          } else {
            await this.createReservationFromEntity(reservation, calendarUrlId);
            created++;
          }
        } catch (error) {
          errors++;
          this.logger.error(
            `Erreur lors du traitement de la réservation ${reservation.externalId}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.debug(
        `Synchronisation terminée pour ${url}: ${created} créée(s), ${updated} mise(s) à jour, ${errors} erreur(s)`,
      );

      return { created, updated, errors };
    } catch (error) {
      errors++;
      this.logger.error(
        `Erreur lors de la récupération des réservations depuis ${url}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async createReservationFromEntity(
    reservation: Reservation,
    calendarUrlId: string,
  ): Promise<void> {
    const createDto: CreateReservationDto = {
      externalId: reservation.externalId,
      price: reservation.price,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      numberOfTravelers: reservation.numberOfTravelers,
      type: reservation.type || 'reservation',
      calendarUrlId,
    };

    await this.reservationService.createReservation(createDto);
  }

  private async updateReservationIfNeeded(
    existingReservation: ReservationDocument,
    newReservation: Reservation,
    calendarUrlId: string,
  ): Promise<void> {
    const needsUpdate =
      existingReservation.startDate.getTime() !==
        newReservation.startDate.getTime() ||
      existingReservation.endDate.getTime() !== newReservation.endDate.getTime() ||
      existingReservation.price !== newReservation.price ||
      existingReservation.numberOfTravelers !== newReservation.numberOfTravelers ||
      existingReservation.type !== newReservation.type ||
      existingReservation.calendarUrlId?.toString() !== calendarUrlId;

    if (needsUpdate) {
      const updateDto: UpdateReservationDto = {
        startDate: newReservation.startDate,
        endDate: newReservation.endDate,
        numberOfTravelers: newReservation.numberOfTravelers,
        type: newReservation.type,
        calendarUrlId,
      };

      await this.reservationService.updateReservation(
        existingReservation._id.toString(),
        updateDto,
      );
    }
  }
}

