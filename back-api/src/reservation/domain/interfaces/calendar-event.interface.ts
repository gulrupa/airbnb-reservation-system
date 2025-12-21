/**
 * Interface générique pour un événement de calendrier
 * Interface de base pour tous les types d'événements de calendrier
 */
export interface CalendarEvent {
  /** Identifiant unique de l'événement */
  uid: string;
  /** Date de début de l'événement */
  startDate: Date;
  /** Date de fin de l'événement */
  endDate: Date;
  /** Résumé/titre de l'événement */
  summary: string;
  /** Description optionnelle de l'événement */
  description?: string;
  /** Date de création/modification de l'événement */
  dtstamp: Date;
}

