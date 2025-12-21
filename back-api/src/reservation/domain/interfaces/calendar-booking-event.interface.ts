import { CalendarEvent } from './calendar-event.interface';

/**
 * Interface pour les événements de réservation/booking dans un calendrier
 * Étend l'interface générique CalendarEvent avec des propriétés spécifiques aux réservations
 */
export interface CalendarBookingEvent extends CalendarEvent {
  /** Indique si c'est un manual block date (blocage manuel de dates) */
  isManualBlockDate?: boolean;
}

