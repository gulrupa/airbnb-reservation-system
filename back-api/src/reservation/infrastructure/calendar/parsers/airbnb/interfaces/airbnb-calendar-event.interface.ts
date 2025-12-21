import { CalendarEvent } from '../../../../../domain/interfaces/calendar-event.interface';

/**
 * Interface spécifique pour les événements de calendrier Airbnb
 * Étend l'interface générique CalendarEvent avec des propriétés spécifiques à Airbnb
 */
export interface AirbnbCalendarEvent extends CalendarEvent {
  /** URL de la réservation Airbnb */
  reservationUrl?: string;
  /** Numéro de téléphone (4 derniers chiffres) */
  phoneNumber?: string;
  /** ID externe de la réservation (extrait depuis l'URL de réservation, toujours présent) */
  externalId: string;
}
