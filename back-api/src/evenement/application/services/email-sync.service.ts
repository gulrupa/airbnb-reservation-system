import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { EmailFetchService } from './email-fetch.service';
import { EmailParserService } from './email-parser.service';
import { EvenementRepository } from '../repositories/evenement.repository';
import { EvenementType } from '../../domain/entities/evenement.entity';

@Injectable()
export class EmailSyncService implements OnModuleInit {
  private readonly logger = new Logger(EmailSyncService.name);
  private readonly CRON_JOB_NAME = 'email-sync';

  constructor(
    private readonly emailFetchService: EmailFetchService,
    private readonly emailParserService: EmailParserService,
    private readonly evenementRepository: EvenementRepository,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'EMAIL_SYNC_CRON',
      '0 */6 * * *', // Toutes les 6 heures par défaut
    );

    this.logger.log(
      `Configuration du cron job de synchronisation email avec l'expression: ${cronExpression}`,
    );

    const job = new CronJob(cronExpression, () => {
      this.handleCronSync();
    });

    this.schedulerRegistry.addCronJob(this.CRON_JOB_NAME, job);
    job.start();

    this.logger.log(
      `Cron job de synchronisation email démarré avec l'expression: ${cronExpression}`,
    );
  }

  async handleCronSync() {
    this.logger.log('Démarrage de la synchronisation des emails Airbnb');

    try {
      const emails = await this.emailFetchService.fetchEmailsFromAirbnb();
      this.logger.log(`${emails.length} email(s) Airbnb récupéré(s)`);

      let totalCreated = 0;
      let totalIgnored = 0;
      let totalErrors = 0;

      for (const email of emails) {
        try {
          const parsedEvent = this.emailParserService.parseEmail(email);

          if (!parsedEvent) {
            totalIgnored++;
            continue;
          }

          // Vérifier si l'événement existe déjà (même réservation, même type, même date)
          // Pour éviter les doublons, on peut vérifier par réservationId et type
          // et une date proche (par exemple, même jour)
          const existingEvents =
            await this.evenementRepository.findByReservationId(
              parsedEvent.reservationId,
            );

          const eventDate = new Date(email.date);
          const isDuplicate = existingEvents.some((event) => {
            const eventDateOnly = new Date(event.dateReception);
            return (
              event.type === parsedEvent.type &&
              eventDateOnly.toDateString() === eventDate.toDateString()
            );
          });

          if (isDuplicate) {
            this.logger.debug(
              `Événement déjà existant ignoré: ${parsedEvent.reservationId} - ${parsedEvent.type}`,
            );
            totalIgnored++;
            continue;
          }

          // Créer l'événement
          await this.evenementRepository.create({
            reservationId: parsedEvent.reservationId,
            dateReception: eventDate,
            type: parsedEvent.type,
            prix: parsedEvent.prix,
          });

          totalCreated++;
          this.logger.debug(
            `Événement créé: ${parsedEvent.reservationId} - ${parsedEvent.type} - ${parsedEvent.prix || 'N/A'}€`,
          );
        } catch (error) {
          totalErrors++;
          this.logger.error(
            `Erreur lors du traitement de l'email "${email.subject}": ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Synchronisation terminée: ${totalCreated} créé(s), ${totalIgnored} ignoré(s), ${totalErrors} erreur(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation des emails: ${error.message}`,
        error.stack,
      );
    }
  }

  async syncEmails() {
    return this.handleCronSync();
  }
}

