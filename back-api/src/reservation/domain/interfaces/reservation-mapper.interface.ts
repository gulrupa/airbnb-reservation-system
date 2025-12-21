import { Reservation } from '../entities/reservation.entity';
import { CalendarBookingEvent } from './calendar-booking-event.interface';

/**
 * Interface générique pour mapper les événements de calendrier en réservations
 * Respecte le principe d'inversion de dépendance (DIP)
 * Peut être implémentée pour différents types de calendriers (Airbnb, Booking, etc.)
 */
export interface IReservationMapper {
  /**
   * Convertit un événement de calendrier en réservation
   * @param event L'événement de calendrier à mapper (booking event)
   * @returns Une réservation ou null si l'événement n'est pas une réservation
   */
  mapToReservation(event: CalendarBookingEvent): Reservation | null;

  /**
   * Convertit plusieurs événements en réservations
   * @param events Les événements à mapper (booking events)
   * @returns Les réservations mappées
   */
  mapToReservations(events: CalendarBookingEvent[]): Reservation[];
}

