import { api } from './api';
import type { Reservation } from '@/types/calendar';

/**
 * Réponse de l'API pour les réservations
 */
export interface ReservationsResponse {
  message: string;
  data: Reservation[];
  count: number;
}

/**
 * Service API pour la gestion des réservations
 * Fournit toutes les méthodes nécessaires pour interagir avec l'API backend
 * concernant les réservations
 */
export const reservationApi = {
  /**
   * Récupère toutes les réservations
   * @returns Liste de toutes les réservations
   */
  getAll: async (): Promise<Reservation[]> => {
    return api.get<Reservation[]>('/reservations');
  },

  /**
   * Récupère une réservation par son ID
   * @param id - ID MongoDB de la réservation
   * @returns Les données de la réservation
   */
  getById: async (id: string): Promise<Reservation> => {
    return api.get<Reservation>(`/reservations/${id}`);
  },

  /**
   * Récupère toutes les réservations associées à un calendrier
   * @param calendarUrlId - ID MongoDB du calendrier
   * @returns Liste des réservations du calendrier
   */
  getByCalendarId: async (calendarUrlId: string): Promise<Reservation[]> => {
    return api.get<Reservation[]>(`/reservations/calendar/${calendarUrlId}`);
  },

  /**
   * Récupère les réservations dans une plage de dates
   * @param startDate - Date de début (ISO string)
   * @param endDate - Date de fin (ISO string)
   * @returns Liste des réservations dans la plage de dates
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<Reservation[]> => {
    return api.get<Reservation[]>(`/reservations/date-range/start/${startDate}/end/${endDate}`);
  },

  /**
   * Récupère les réservations du mois en cours
   * @returns Liste des réservations du mois en cours
   */
  getCurrentMonth: async (): Promise<Reservation[]> => {
    const response = await api.get<ReservationsResponse>('/statistiques/reservations/current-month');
    return response.data;
  },

  /**
   * Récupère les réservations d'un mois et d'une année spécifiques
   * @param year Année
   * @param month Mois (0-11)
   * @returns Liste des réservations du mois
   */
  getByMonth: async (year: number, month: number): Promise<Reservation[]> => {
    const response = await api.get<ReservationsResponse>(`/statistiques/reservations/month/${year}/${month}`);
    return response.data;
  },

  /**
   * Récupère les réservations à venir
   * @returns Liste des réservations futures
   */
  getFuture: async (): Promise<Reservation[]> => {
    const response = await api.get<ReservationsResponse>('/reservations/future');
    return response.data;
  },

  /**
   * Met à jour une réservation
   * @param id - ID MongoDB de la réservation
   * @param data - Données partielles à mettre à jour
   * @returns La réservation mise à jour
   */
  update: async (id: string, data: Partial<Reservation>): Promise<Reservation> => {
    return api.put<Reservation>(`/reservations/${id}`, data);
  },

  /**
   * Supprime une réservation
   * @param id - ID MongoDB de la réservation
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/reservations/${id}`);
  },
};

