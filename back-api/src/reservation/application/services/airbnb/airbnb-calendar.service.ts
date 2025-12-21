import { Injectable, Inject } from '@nestjs/common';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { IAirbnbCalendarService } from './interfaces/airbnb-calendar-service.interface';
import { ICalendarFetcher } from '../../../domain/interfaces/calendar-fetcher.interface';
import { IAirbnbCalendarParser } from '../../../infrastructure/calendar/parsers/airbnb/interfaces/airbnb-calendar-parser.interface';
import { IAirbnbReservationMapper } from '../../../infrastructure/mappers/airbnb/interfaces/airbnb-reservation-mapper.interface';

/**
 * Service principal pour récupérer les réservations depuis un calendrier Airbnb
 * Respecte les principes SOLID :
 * - Single Responsibility: Récupère et transforme les réservations Airbnb
 * - Open/Closed: Ouvert à l'extension via les interfaces
 * - Liskov Substitution: Utilise des interfaces abstraites et spécifiques
 * - Interface Segregation: Interfaces séparées (génériques et spécifiques)
 * - Dependency Inversion: Dépend des abstractions, pas des implémentations
 */
@Injectable()
export class AirbnbCalendarService implements IAirbnbCalendarService {
  constructor(
    @Inject('ICalendarFetcher')
    private readonly calendarFetcher: ICalendarFetcher,
    @Inject('IAirbnbCalendarParser')
    private readonly calendarParser: IAirbnbCalendarParser,
    @Inject('IAirbnbReservationMapper')
    private readonly reservationMapper: IAirbnbReservationMapper,
  ) {}

  /**
   * Récupère et parse un calendrier iCal depuis une URL Airbnb
   * @param url L'URL du calendrier iCal Airbnb
   * @returns Les réservations extraites du calendrier
   */
  async fetchReservations(url: string): Promise<Reservation[]> {
    // 1. Récupérer les données iCal
    const icalData = await this.calendarFetcher.fetch(url);

    // 2. Parser les événements Airbnb (retourne AirbnbCalendarEvent[])
    const airbnbEvents = this.calendarParser.parse(icalData);

    // 3. Filtrer et mapper uniquement les réservations (utilise la méthode spécifique Airbnb)
    const reservations = this.reservationMapper.mapToReservations(airbnbEvents);

    return reservations;
  }
}

