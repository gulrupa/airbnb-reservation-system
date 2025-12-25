import { api } from './api';
import type { Reservation } from '@/types/calendar';

/**
 * Interface pour les statistiques
 */
export interface Statistiques {
  currentMonthRevenue: number;
  futureRevenue: number;
  yearRevenue: number;
  occupancyRate: number;
  currentMonthReservations: number;
  averageRevenuePerReservation: number;
  averageRevenuePerNight: number;
  totalNights: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
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
 * Réponse de l'API pour les réservations
 */
export interface ReservationsResponse {
  message: string;
  data: Reservation[];
  count: number;
}

/**
 * Service API pour les statistiques
 */
export const statistiquesApi = {
  /**
   * Récupère les dernières statistiques calculées
   * @returns Les statistiques les plus récentes
   */
  getStatistics: async (): Promise<Statistiques> => {
    const response = await api.get<StatistiquesResponse>('/statistiques');
    if (!response.data) {
      throw new Error('Aucune statistique disponible');
    }
    return response.data;
  },

  /**
   * Récupère les réservations du mois en cours
   * @returns Liste des réservations du mois en cours
   */
  getCurrentMonthReservations: async (): Promise<Reservation[]> => {
    const response = await api.get<ReservationsResponse>('/statistiques/reservations/current-month');
    return response.data;
  },

  /**
   * Récupère les réservations à venir
   * @returns Liste des réservations futures
   */
  getFutureReservations: async (): Promise<Reservation[]> => {
    const response = await api.get<ReservationsResponse>('/statistiques/reservations/future');
    return response.data;
  },
};

