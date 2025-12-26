import { api } from './api';

/**
 * Interface pour les statistiques annuelles
 */
export interface Statistiques {
  currentMonthRevenue: number;
  futureRevenue: number;
  yearRevenue: number;
  occupancyRate: number;
  currentMonthOccupancyRate: number;
  currentMonthReservations: number;
  averageRevenuePerReservation: number;
  averageRevenuePerNight: number;
  averageReservationDuration: number;
  currentMonthAveragePricePerNight: number;
  currentMonthAverageReservationDuration: number;
  totalNights: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  calculatedAt: string;
  year: number;
}

/**
 * Interface pour les statistiques mensuelles
 */
export interface StatistiquesMensuelles {
  year: number;
  month: number;
  revenue: number;
  reservations: number;
  occupancyRate: number;
  averagePricePerNight: number;
  averageReservationDuration: number;
  calculatedAt: string;
}

/**
 * Réponse de l'API statistiques
 */
export interface StatistiquesResponse {
  message: string;
  data: Statistiques | null;
}

/**
 * Service API pour les statistiques
 */
export const statistiquesApi = {
  /**
   * Récupère les statistiques pour une année donnée (ou année en cours par défaut)
   * @param year Année (optionnel)
   * @returns Les statistiques de l'année
   */
  getStatistics: async (year?: number): Promise<Statistiques> => {
    const url = year ? `/statistiques?year=${year}` : '/statistiques';
    const response = await api.get<StatistiquesResponse>(url);
    if (!response.data) {
      throw new Error('Aucune statistique disponible');
    }
    return response.data;
  },

  /**
   * Récupère les statistiques mensuelles pour un mois spécifique
   * @param year Année
   * @param month Mois (0-11)
   * @returns Les statistiques mensuelles
   */
  getMonthlyStatistics: async (year: number, month: number): Promise<StatistiquesMensuelles | null> => {
    const response = await api.get<{ message: string; data: StatistiquesMensuelles | null }>(
      `/statistiques/monthly/${year}/${month}`,
    );
    return response.data;
  },

  /**
   * Récupère les années disponibles
   * @returns Liste des années disponibles
   */
  getAvailableYears: async (): Promise<number[]> => {
    const response = await api.get<{ message: string; data: number[] }>('/statistiques/years');
    return response.data;
  },

};

