import { api } from './api';
import type { CalendarUrl, CreateCalendarUrlDto, UpdateCalendarUrlDto } from '@/types/calendar';

/**
 * Service API pour la gestion des calendriers
 * Fournit toutes les méthodes nécessaires pour interagir avec l'API backend
 * concernant les calendriers et leurs réservations
 */
export const calendarApi = {
  /**
   * Récupère tous les calendriers
   * @returns Liste de tous les calendriers enregistrés
   */
  getAll: async (): Promise<CalendarUrl[]> => {
    return api.get<CalendarUrl[]>('/calendar-urls');
  },

  /**
   * Récupère un calendrier par son ID
   * @param id - ID MongoDB du calendrier
   * @returns Les données du calendrier
   */
  getById: async (id: string): Promise<CalendarUrl> => {
    return api.get<CalendarUrl>(`/calendar-urls/${id}`);
  },

  /**
   * Crée un nouveau calendrier
   * @param data - Données du calendrier à créer
   * @returns Le calendrier créé avec son ID
   */
  create: async (data: CreateCalendarUrlDto): Promise<CalendarUrl> => {
    return api.post<CalendarUrl>('/calendar-urls', data);
  },

  /**
   * Met à jour un calendrier existant
   * @param id - ID MongoDB du calendrier à mettre à jour
   * @param data - Données partielles à mettre à jour
   * @returns Le calendrier mis à jour
   */
  update: async (id: string, data: UpdateCalendarUrlDto): Promise<CalendarUrl> => {
    return api.put<CalendarUrl>(`/calendar-urls/${id}`, data);
  },

  /**
   * Supprime un calendrier
   * @param id - ID MongoDB du calendrier à supprimer
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/calendar-urls/${id}`);
  },

  /**
   * Synchronise un calendrier avec l'API externe (Airbnb, etc.)
   * Récupère les nouvelles réservations et met à jour les existantes
   * @param id - ID MongoDB du calendrier à synchroniser
   * @returns Statistiques de la synchronisation (créées, mises à jour)
   */
  sync: async (id: string): Promise<{ message: string; created: number; updated: number }> => {
    return api.post<{ message: string; created: number; updated: number }>(
      `/calendar-urls/${id}/sync`,
    );
  },

};

