import { Reservation } from '../../../../domain/entities/reservation.entity';

/**
 * Interface principale du service de calendrier Airbnb
 * Respecte le principe d'inversion de dépendance (DIP)
 */
export interface IAirbnbCalendarService {
  /**
   * Récupère et parse un calendrier iCal depuis une URL Airbnb
   * @param url L'URL du calendrier iCal Airbnb
   * @returns Les réservations extraites du calendrier
   */
  fetchReservations(url: string): Promise<Reservation[]>;
}

