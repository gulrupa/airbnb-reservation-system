import { IReservationMapper } from '../../../../domain/interfaces/reservation-mapper.interface';
import { AirbnbCalendarEvent } from '../../../calendar/parsers/airbnb/interfaces/airbnb-calendar-event.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';

/**
 * Interface spécifique pour mapper les événements Airbnb en réservations
 * Étend l'interface générique IReservationMapper
 */
export interface IAirbnbReservationMapper extends IReservationMapper {
  /**
   * Convertit un événement Airbnb en réservation
   * @param event L'événement Airbnb à mapper
   * @returns Une réservation ou null si l'événement n'est pas une réservation
   */
  mapToReservation(event: AirbnbCalendarEvent): Reservation | null;

  /**
   * Convertit plusieurs événements Airbnb en réservations
   * @param events Les événements Airbnb à mapper
   * @returns Les réservations mappées
   */
  mapToReservations(events: AirbnbCalendarEvent[]): Reservation[];

}

