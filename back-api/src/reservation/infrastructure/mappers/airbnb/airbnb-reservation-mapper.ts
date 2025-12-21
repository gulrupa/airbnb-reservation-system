import { Injectable } from '@nestjs/common';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { AirbnbCalendarEvent } from '../../calendar/parsers/airbnb/interfaces/airbnb-calendar-event.interface';
import { IAirbnbReservationMapper } from './interfaces/airbnb-reservation-mapper.interface';
import { CalendarEvent } from '../../../domain/interfaces/calendar-event.interface';
import { randomUUID } from 'crypto';

/**
 * Mapper spécifique pour convertir les événements de calendrier Airbnb en réservations
 */
@Injectable()
export class AirbnbReservationMapper implements IAirbnbReservationMapper {
  /**
   * Convertit un événement de calendrier générique en réservation
   * @param event L'événement de calendrier à mapper
   * @returns Une réservation ou null si l'événement n'est pas une réservation
   */
  mapToReservation(event: CalendarEvent): Reservation | null {
    // Vérifier si c'est un événement Airbnb
    if (!this.isAirbnbEvent(event)) {
      return null;
    }

    return this.mapAirbnbEventToReservation(event as AirbnbCalendarEvent);
  }

  /**
   * Convertit un événement Airbnb spécifique en réservation
   * @param event L'événement Airbnb à mapper
   * @returns Une réservation ou null si l'événement n'est pas une réservation
   */
  mapAirbnbEventToReservation(event: AirbnbCalendarEvent): Reservation | null {
    // Ne mapper que les événements qui sont des réservations
    if (event.summary !== 'Reserved' || !event.reservationUrl) {
      return null;
    }

    // Générer un internalId unique
    const internalId = randomUUID();

    // Utiliser l'externalId extrait directement par le parser
    // L'externalId est toujours présent car le parser lance une erreur s'il ne peut pas l'extraire
    const externalId = event.externalId;

    // Calculer le nombre de nuits pour estimer le prix si nécessaire
    // Pour l'instant, on met 0 car le prix n'est pas dans le calendrier
    const price = 0;

    // Le nombre de voyageurs n'est pas disponible dans le calendrier
    // On met une valeur par défaut
    const numberOfTravelers = 1;

    return new Reservation(
      internalId,
      externalId,
      price,
      event.startDate,
      event.endDate,
      numberOfTravelers,
    );
  }

  /**
   * Convertit plusieurs événements génériques en réservations
   * @param events Les événements à mapper
   * @returns Les réservations mappées (filtre les null)
   */
  mapToReservations(events: CalendarEvent[]): Reservation[] {
    return events
      .map((event) => this.mapToReservation(event))
      .filter((reservation): reservation is Reservation => reservation !== null);
  }

  /**
   * Convertit plusieurs événements Airbnb en réservations
   * @param events Les événements Airbnb à mapper
   * @returns Les réservations mappées (filtre les null)
   */
  mapAirbnbEventsToReservations(events: AirbnbCalendarEvent[]): Reservation[] {
    return events
      .map((event) => this.mapAirbnbEventToReservation(event))
      .filter((reservation): reservation is Reservation => reservation !== null);
  }

  /**
   * Vérifie si un événement est un événement Airbnb
   * @param event L'événement à vérifier
   * @returns true si c'est un événement Airbnb
   */
  private isAirbnbEvent(event: CalendarEvent): boolean {
    // Vérifier si l'événement a les propriétés spécifiques Airbnb
    return 'reservationUrl' in event || 'phoneNumber' in event;
  }
}

