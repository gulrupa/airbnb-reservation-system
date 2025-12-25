import { api } from './api';

/**
 * Service API pour la gestion des jobs
 * Fournit toutes les méthodes nécessaires pour déclencher manuellement les jobs
 */
export const jobsApi = {
  /**
   * Déclenche manuellement la synchronisation des calendriers
   * @returns Message de confirmation
   */
  triggerCalendarSync: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/jobs/calendar-sync');
  },

  /**
   * Déclenche manuellement la synchronisation des emails Airbnb
   * @returns Message de confirmation
   */
  triggerEmailSync: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/jobs/email-sync');
  },

  /**
   * Déclenche manuellement le traitement des événements
   * @returns Message de confirmation
   */
  triggerEventProcessor: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/jobs/event-processor');
  },
};

