import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ReservationRepository } from '../../../reservation/application/repositories/reservation.repository';
import { StatistiquesRepository } from '../repositories/statistiques.repository';
import { ReservationDocument } from '../../../reservation/infrastructure/database/schemas/reservation.schema';
import { Reservation } from 'src/reservation/domain/entities/reservation.entity';


@Injectable()
export class StatistiquesService implements OnModuleInit {
  private readonly logger = new Logger(StatistiquesService.name);
  private readonly CRON_JOB_NAME = 'statistiques-calculation';

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly statistiquesRepository: StatistiquesRepository,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'STATISTIQUES_CRON',
      '0 0 * * *', // Tous les jours à 00h par défaut
    );

    this.logger.log(
      `Configuration du cron job de calcul des statistiques avec l'expression: ${cronExpression}`,
    );

    const job = new CronJob(cronExpression, () => {
      this.handleCronCalculation();
    });

    this.schedulerRegistry.addCronJob(this.CRON_JOB_NAME, job);
    job.start();

    this.logger.log(
      `Cron job de calcul des statistiques démarré avec l'expression: ${cronExpression}`,
    );

    // Calculer les statistiques au démarrage si elles n'existent pas
    this.initializeStatistics();
  }

  async initializeStatistics() {
    const latest = await this.statistiquesRepository.findLatest();
    if (!latest) {
      this.logger.log('Aucune statistique trouvée, calcul initial...');
      await this.calculateAndSaveStatistics();
    }
  }

  async handleCronCalculation() {
    this.logger.log('Démarrage du calcul des statistiques (cron job)');
    try {
      await this.calculateAndSaveStatistics();
      this.logger.log('Calcul des statistiques terminé avec succès');
    } catch (error) {
      this.logger.error(
        `Erreur lors du calcul des statistiques: ${error.message}`,
        error.stack,
      );
    }
  }

  async calculateAndSaveStatistics() {
    // Récupérer toutes les réservations sous forme d'objets JavaScript simples
    const allReservations = await this.reservationRepository.findAllLean();

    // Filtrer uniquement les réservations valides (pas les blocages manuels)
    const validReservations = allReservations.filter(
      (r: Reservation) => r.type !== 'manual_block_date',
    );

    const now = new Date();

    // Revenus du mois en cours
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const currentMonthRevenue = validReservations
      .filter((r) => {
        const startDate = new Date(r.startDate);
        return startDate >= startOfMonth && startDate <= endOfMonth;
      })
      .reduce((sum, r) => sum + r.price, 0);

    // Revenus à venir (futurs)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureRevenue = validReservations
      .filter((r) => {
        const startDate = new Date(r.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate > today;
      })
      .reduce((sum, r) => sum + r.price, 0);

    // Revenus par mois pour le graphique (12 derniers mois)
    const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const revenue = validReservations
        .filter((r) => {
          const startDate = new Date(r.startDate);
          return startDate >= monthStart && startDate <= monthEnd;
        })
        .reduce((sum, r) => sum + r.price, 0);

      monthlyRevenue.push({
        month: date.toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
        revenue,
      });
    }

    // Revenus de l'année en cours
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const yearRevenue = validReservations
      .filter((r) => {
        const startDate = new Date(r.startDate);
        return startDate >= yearStart && startDate <= yearEnd;
      })
      .reduce((sum, r) => sum + r.price, 0);

    // Taux de remplissage (jours réservés / jours disponibles)
    const reservedDays = new Set<string>();
    validReservations.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      let current = new Date(start);
      while (current < end) {
        if (current >= yearStart && current <= yearEnd) {
          reservedDays.add(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    const totalDays =
      Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) +
      1;
    const occupancyRate = (reservedDays.size / totalDays) * 100;

    // Taux de remplissage du mois en cours (jours réservés / jours disponibles dans le mois)
    const monthReservedDays = new Set<string>();
    validReservations.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      let current = new Date(start);
      while (current < end) {
        if (current >= startOfMonth && current <= endOfMonth) {
          monthReservedDays.add(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    const monthTotalDays =
      Math.ceil((endOfMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) +
      1;
    const currentMonthOccupancyRate = (monthReservedDays.size / monthTotalDays) * 100;

    // Réservations du mois
    const currentMonthReservationsList = validReservations.filter((r) => {
      const startDate = new Date(r.startDate);
      return startDate >= startOfMonth && startDate <= endOfMonth;
    });
    const currentMonthReservations = currentMonthReservationsList.length;

    // Revenu moyen par réservation
    const averageRevenuePerReservation =
      validReservations.length > 0
        ? validReservations.reduce((sum, r) => sum + r.price, 0) /
          validReservations.length
        : 0;

    // Revenu moyen par nuit et nombre total de nuits
    let totalRevenue = 0;
    let totalNights = 0;
    let totalReservationDurations = 0;

    validReservations.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const nights = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      totalRevenue += r.price;
      totalNights += nights;
      totalReservationDurations += nights;
    });

    const averageRevenuePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;
    const averageReservationDuration =
      validReservations.length > 0
        ? totalReservationDurations / validReservations.length
        : 0;

    // Statistiques du mois en cours
    let currentMonthTotalRevenue = 0;
    let currentMonthTotalNights = 0;
    let currentMonthTotalDurations = 0;

    currentMonthReservationsList.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const nights = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      currentMonthTotalRevenue += r.price;
      currentMonthTotalNights += nights;
      currentMonthTotalDurations += nights;
    });

    const currentMonthAveragePricePerNight =
      currentMonthTotalNights > 0
        ? currentMonthTotalRevenue / currentMonthTotalNights
        : 0;
    const currentMonthAverageReservationDuration =
      currentMonthReservations > 0
        ? currentMonthTotalDurations / currentMonthReservations
        : 0;

    // Sauvegarder les statistiques
    const calculatedAt = new Date();
    calculatedAt.setHours(0, 0, 0, 0); // Normaliser à minuit pour éviter les doublons

    // Supprimer l'ancienne statistique du jour si elle existe
    await this.statistiquesRepository.deleteByDate(calculatedAt);

    await this.statistiquesRepository.create({
      currentMonthRevenue,
      futureRevenue,
      yearRevenue,
      occupancyRate,
      currentMonthOccupancyRate,
      currentMonthReservations,
      averageRevenuePerReservation,
      averageRevenuePerNight,
      averageReservationDuration,
      currentMonthAveragePricePerNight,
      currentMonthAverageReservationDuration,
      totalNights,
      monthlyRevenue,
      calculatedAt,
    });

    // Nettoyer les anciennes statistiques (garder 90 jours)
    const deletedCount = await this.statistiquesRepository.deleteOld(90);
    if (deletedCount > 0) {
      this.logger.log(`Suppression de ${deletedCount} anciennes statistiques`);
    }

    this.logger.log('Statistiques calculées et sauvegardées avec succès');
  }

  async getLatestStatistics() {
    const stats = await this.statistiquesRepository.findLatest();
    if (!stats) {
      // Si aucune statistique n'existe, calculer immédiatement
      await this.calculateAndSaveStatistics();
      return this.statistiquesRepository.findLatest();
    }
    return stats;
  }

  async getCurrentMonthReservations() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.reservationRepository.findValidReservationsByStartDateRange(
      startOfMonth,
      endOfMonth,
    );
  }

  async getFutureReservations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.reservationRepository.findValidReservationsAfterDate(today);
  }
}

