import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ReservationRepository } from '../repositories/reservation.repository';
import { EvenementRepository } from '../../../evenement/application/repositories/evenement.repository';
import { EvenementType } from '../../../evenement/infrastructure/database/schemas/evenement.schema';

@Injectable()
export class EventProcessorService implements OnModuleInit {
  private readonly logger = new Logger(EventProcessorService.name);
  private readonly CRON_JOB_NAME = 'event-processor';

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly evenementRepository: EvenementRepository,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'EVENT_PROCESSOR_CRON',
      '*/5 * * * *', // Toutes les 5 minutes par défaut
    );

    this.logger.log(
      `Configuration du cron job de traitement des événements avec l'expression: ${cronExpression}`,
    );

    const job = new CronJob(cronExpression, () => {
      this.handleCronProcess();
    });

    this.schedulerRegistry.addCronJob(this.CRON_JOB_NAME, job);
    job.start();

    this.logger.log(
      `Cron job de traitement des événements démarré avec l'expression: ${cronExpression}`,
    );
  }

  async handleCronProcess() {
    this.logger.log('Démarrage du traitement des événements');

    try {
      const evenementsNonTraites =
        await this.evenementRepository.findNonTraites();
      this.logger.log(
        `${evenementsNonTraites.length} événement(s) non traité(s) trouvé(s)`,
      );

      let totalProcessed = 0;
      let totalErrors = 0;

      for (const evenement of evenementsNonTraites) {
        try {
          await this.processEvenement(evenement);
          totalProcessed++;
        } catch (error) {
          totalErrors++;
          this.logger.error(
            `Erreur lors du traitement de l'événement ${evenement._id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Traitement terminé: ${totalProcessed} traité(s), ${totalErrors} erreur(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement des événements: ${error.message}`,
        error.stack,
      );
    }
  }

  async processEvenement(evenement: any): Promise<void> {
    this.logger.debug(
      `Traitement de l'événement ${evenement._id} (type: ${evenement.type}, reservationId: ${evenement.reservationId})`,
    );

    // Trouver la réservation par externalId (qui correspond au reservationId de l'événement)
    const reservation =
      await this.reservationRepository.findByExternalId(
        evenement.reservationId,
      );

    if (!reservation) {
      this.logger.warn(
        `Réservation non trouvée pour l'ID externe: ${evenement.reservationId}. L'événement sera marqué comme traité.`,
      );
      // Marquer comme traité même si la réservation n'existe pas pour éviter de retraiter indéfiniment
      await this.evenementRepository.markAsTraite(evenement._id.toString());
      return;
    }

    // Traiter selon le type d'événement
    switch (evenement.type) {
      case EvenementType.VERSEMENT:
        await this.processVersement(reservation, evenement);
        break;

      case EvenementType.CREATION:
        await this.processCreation(reservation, evenement);
        break;

      case EvenementType.ANNULATION:
        await this.processAnnulation(reservation, evenement);
        break;

      default:
        this.logger.warn(
          `Type d'événement inconnu: ${evenement.type}. L'événement sera marqué comme traité.`,
        );
        await this.evenementRepository.markAsTraite(evenement._id.toString());
        return;
    }

    // Marquer l'événement comme traité
    await this.evenementRepository.markAsTraite(evenement._id.toString());
    this.logger.debug(
      `Événement ${evenement._id} traité avec succès et marqué comme traité`,
    );
  }

  private async processVersement(reservation: any, evenement: any): Promise<void> {
    this.logger.debug(
      `Traitement versement pour la réservation ${reservation.externalId}: prix=${evenement.prix}`,
    );

    const updateData: any = {
      status: 'paid',
    };

    if (evenement.prix !== undefined && evenement.prix !== null) {
      updateData.price = evenement.prix;
    }

    await this.reservationRepository.update(
      reservation._id.toString(),
      updateData,
    );

    this.logger.log(
      `Réservation ${reservation.externalId} mise à jour: status=paid, prix=${evenement.prix || reservation.price}`,
    );
  }

  private async processCreation(reservation: any, evenement: any): Promise<void> {
    this.logger.debug(
      `Traitement création pour la réservation ${reservation.externalId}: prix=${evenement.prix}`,
    );

    const updateData: any = {
      status: 'confirmed',
    };

    if (evenement.prix !== undefined && evenement.prix !== null) {
      updateData.price = evenement.prix;
    }

    await this.reservationRepository.update(
      reservation._id.toString(),
      updateData,
    );

    this.logger.log(
      `Réservation ${reservation.externalId} mise à jour: status=confirmed, prix=${evenement.prix || reservation.price}`,
    );
  }

  private async processAnnulation(reservation: any, evenement: any): Promise<void> {
    this.logger.debug(
      `Traitement annulation pour la réservation ${reservation.externalId}: prix=${evenement.prix}`,
    );

    const updateData: any = {
      status: 'canceled',
    };

    if (evenement.prix !== undefined && evenement.prix !== null) {
      updateData.price = evenement.prix;
    }

    await this.reservationRepository.update(
      reservation._id.toString(),
      updateData,
    );

    this.logger.log(
      `Réservation ${reservation.externalId} mise à jour: status=canceled, prix=${evenement.prix || reservation.price}`,
    );
  }

  async processEvents() {
    return this.handleCronProcess();
  }
}

