import { Reservation } from '../entities/reservation.entity';
import { CalendarEvent } from './calendar-event.interface';

/**
 * Interface générique pour mapper les événements de calendrier en réservations
 * Respecte le principe d'inversion de dépendance (DIP)
 * Peut être implémentée pour différents types de calendriers (Airbnb, Booking, etc.)
 */
export interface IReservationMapper {
  /**
   * Convertit un événement de calendrier en réservation
   * @param event L'événement de calendrier à mapper (générique)
   * @returns Une réservation ou null si l'événement n'est pas une réservation
   */
  mapToReservation(event: CalendarEvent): Reservation | null;

  /**
   * Convertit plusieurs événements en réservations
   * @param events Les événements à mapper (génériques)
   * @returns Les réservations mappées
   */
  mapToReservations(events: CalendarEvent[]): Reservation[];
}

