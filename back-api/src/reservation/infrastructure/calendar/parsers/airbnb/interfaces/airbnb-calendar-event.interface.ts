import { CalendarBookingEvent } from '../../../../../domain/interfaces/calendar-booking-event.interface';

/**
 * Interface spécifique pour les événements de calendrier Airbnb
 * Étend l'interface CalendarBookingEvent avec des propriétés spécifiques à Airbnb
 */
export interface AirbnbCalendarEvent extends CalendarBookingEvent {
  /** URL de la réservation Airbnb */
  reservationUrl?: string;
  /** Numéro de téléphone (4 derniers chiffres) */
  phoneNumber?: string;
  /** ID externe de la réservation (extrait depuis l'URL de réservation ou généré pour manual block dates) */
  externalId: string;
}
