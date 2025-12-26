import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ReservationRepository } from '../../../reservation/application/repositories/reservation.repository';
import { StatistiquesRepository } from '../repositories/statistiques.repository';
import { StatistiquesMensuellesRepository } from '../repositories/statistiques-mensuelles.repository';
import { ReservationDocument } from '../../../reservation/infrastructure/database/schemas/reservation.schema';
import { Reservation } from 'src/reservation/domain/entities/reservation.entity';


@Injectable()
export class StatistiquesService implements OnModuleInit {
  private readonly logger = new Logger(StatistiquesService.name);
  private readonly CRON_JOB_NAME = 'statistiques-calculation';

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly statistiquesRepository: StatistiquesRepository,
    private readonly statistiquesMensuellesRepository: StatistiquesMensuellesRepository,
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
    const currentYear = new Date().getFullYear();
    const latest = await this.statistiquesRepository.findByYear(currentYear);
    if (!latest) {
      this.logger.log('Aucune statistique trouvée pour l\'année en cours, calcul initial...');
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

  /**
   * Calcule les statistiques pour toutes les années qui ont des réservations
   */
  async calculateAndSaveStatistics() {
    // Récupérer toutes les réservations pour déterminer les années
    const allReservations = await this.reservationRepository.findAllLean();
    
    // Extraire les années uniques des réservations
    const years = new Set<number>();
    allReservations.forEach((r: any) => {
      if (r.startDate) {
        const year = new Date(r.startDate).getFullYear();
        years.add(year);
      }
    });

    // Ajouter l'année en cours si elle n'a pas de réservations
    const currentYear = new Date().getFullYear();
    years.add(currentYear);

    this.logger.log(`Calcul des statistiques pour ${years.size} année(s): ${Array.from(years).sort().join(', ')}`);

    // Calculer les statistiques pour chaque année
    for (const year of years) {
      await this.calculateStatisticsForYear(year);
      // Calculer les statistiques mensuelles pour chaque mois de l'année
      await this.calculateMonthlyStatisticsForYear(year);
    }
  }

  /**
   * Calcule les statistiques mensuelles pour tous les mois d'une année
   */
  async calculateMonthlyStatisticsForYear(year: number) {
    const validReservations = await this.getValidReservationsForYear(year);

    // Calculer les statistiques pour chaque mois de l'année
    for (let month = 0; month < 12; month++) {
      await this.calculateStatisticsForMonth(year, month, validReservations);
    }
  }

  /**
   * Récupère les réservations valides pour une année
   */
  private async getValidReservationsForYear(year: number) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const yearReservations = await this.reservationRepository.findValidReservationsByStartDateRange(
      yearStart,
      yearEnd,
    );

    return yearReservations.filter(
      (r: any) => r.type !== 'manual_block_date',
    );
  }

  /**
   * Calcule les statistiques pour un mois spécifique
   */
  async calculateStatisticsForMonth(
    year: number,
    month: number,
    validReservations?: any[],
  ) {
    if (!validReservations) {
      validReservations = await this.getValidReservationsForYear(year);
    }

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    // Filtrer les réservations du mois
    const monthReservations = validReservations.filter((r) => {
      const startDate = new Date(r.startDate);
      return startDate >= monthStart && startDate <= monthEnd;
    });

    // Revenus du mois
    const revenue = monthReservations.reduce((sum, r) => sum + r.price, 0);
    const reservations = monthReservations.length;

    // Taux de remplissage du mois
    const monthReservedDays = new Set<string>();
    monthReservations.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      let current = new Date(start);
      while (current < end) {
        if (current >= monthStart && current <= monthEnd) {
          monthReservedDays.add(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    const monthTotalDays =
      Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const occupancyRate = (monthReservedDays.size / monthTotalDays) * 100;

    // Prix moyen par nuit et durée moyenne
    let totalRevenue = 0;
    let totalNights = 0;
    let totalDurations = 0;

    monthReservations.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      totalRevenue += r.price;
      totalNights += nights;
      totalDurations += nights;
    });

    const averagePricePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;
    const averageReservationDuration =
      reservations > 0 ? totalDurations / reservations : 0;

    // Sauvegarder les statistiques mensuelles
    await this.statistiquesMensuellesRepository.updateByYearAndMonth(year, month, {
      year,
      month,
      revenue,
      reservations,
      occupancyRate,
      averagePricePerNight,
      averageReservationDuration,
    });
  }

  /**
   * Calcule et sauvegarde les statistiques pour une année donnée
   */
  async calculateStatisticsForYear(year: number) {
    const now = new Date();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    // Récupérer uniquement les réservations de l'année donnée
    const yearReservations = await this.reservationRepository.findValidReservationsByStartDateRange(
      yearStart,
      yearEnd,
    );

    // Filtrer uniquement les réservations valides (pas les blocages manuels)
    const validReservations = yearReservations.filter(
      (r: any) => r.type !== 'manual_block_datee'
    );

    // Pour les revenus à venir, on doit aussi inclure les réservations futures (uniquement pour l'année en cours)
    let futureRevenue = 0;
    if (year === now.getFullYear()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureReservations = await this.reservationRepository.findValidReservationsAfterDate(today);
      const validFutureReservations = futureReservations.filter(
        (r: any) => r.type !== 'manual_block_date',
      );
      futureRevenue = validFutureReservations.reduce((sum, r) => sum + r.price, 0);
    }

    // Revenus du mois en cours (uniquement pour l'année en cours)
    let currentMonthRevenue = 0;
    let currentMonthReservations = 0;
    let currentMonthOccupancyRate = 0;
    let currentMonthAveragePricePerNight = 0;
    let currentMonthAverageReservationDuration = 0;

    if (year === now.getFullYear()) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const currentMonthReservationsList = validReservations.filter((r) => {
        const startDate = new Date(r.startDate);
        return startDate >= startOfMonth && startDate <= endOfMonth;
      });

      currentMonthRevenue = currentMonthReservationsList.reduce((sum, r) => sum + r.price, 0);
      currentMonthReservations = currentMonthReservationsList.length;

      // Taux de remplissage du mois en cours
      const monthReservedDays = new Set<string>();
      currentMonthReservationsList.forEach((r) => {
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
      currentMonthOccupancyRate = (monthReservedDays.size / monthTotalDays) * 100;

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

      currentMonthAveragePricePerNight =
        currentMonthTotalNights > 0
          ? currentMonthTotalRevenue / currentMonthTotalNights
          : 0;
      currentMonthAverageReservationDuration =
        currentMonthReservations > 0
          ? currentMonthTotalDurations / currentMonthReservations
          : 0;
    }

    // Revenus par mois pour le graphique (12 mois de l'année)
    const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      const revenue = validReservations
        .filter((r) => {
          const startDate = new Date(r.startDate);
          return startDate >= monthStart && startDate <= monthEnd;
        })
        .reduce((sum, r) => sum + r.price, 0);

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
        revenue,
      });
    }

    // Revenus de l'année
    const yearRevenue = validReservations.reduce((sum, r) => sum + r.price, 0);

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

    // Mettre à jour les statistiques pour cette année (ou créer si elles n'existent pas)
    await this.statistiquesRepository.updateByYear(year, {
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
      year,
    });

    this.logger.log(`Statistiques pour l'année ${year} calculées et sauvegardées avec succès`);
  }

  async getLatestStatistics() {
    const currentYear = new Date().getFullYear();
    return this.getStatisticsByYear(currentYear);
  }

  async getStatisticsByYear(year: number) {
    const stats = await this.statistiquesRepository.findByYear(year);
    if (!stats) {
      // Si aucune statistique n'existe pour l'année, calculer immédiatement
      this.logger.log(`Aucune statistique trouvée pour l'année ${year}, calcul immédiat...`);
      await this.calculateStatisticsForYear(year);
      return this.statistiquesRepository.findByYear(year);
    }
    return stats;
  }

  async getMonthlyStatistics(year: number, month: number) {
    return this.statistiquesMensuellesRepository.findByYearAndMonth(year, month);
  }

  async getAvailableYears(): Promise<number[]> {
    return this.statistiquesRepository.findAllYears();
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

  async getMonthReservations(year: number, month: number) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    return this.reservationRepository.findValidReservationsByStartDateRange(
      startOfMonth,
      endOfMonth,
    );
  }
}

