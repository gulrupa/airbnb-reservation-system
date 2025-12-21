import { ICalendarParser } from '../../../../../domain/interfaces/calendar-parser.interface';
import { AirbnbCalendarEvent } from './airbnb-calendar-event.interface';

/**
 * Interface spécifique pour parser les calendriers Airbnb
 * Étend l'interface générique ICalendarParser
 */
export interface IAirbnbCalendarParser extends ICalendarParser {
  /**
   * Parse les données iCal Airbnb et retourne les événements spécifiques Airbnb
   * @param icalData Les données iCal à parser
   * @returns Les événements Airbnb parsés
   */
  parse(icalData: string): AirbnbCalendarEvent[];
}

