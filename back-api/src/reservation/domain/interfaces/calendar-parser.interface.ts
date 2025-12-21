import { CalendarEvent } from './calendar-event.interface';

/**
 * Interface générique pour parser les données de calendrier
 * Respecte le principe d'inversion de dépendance (DIP)
 * Peut être implémentée pour différents formats (iCal, JSON, etc.)
 */
export interface ICalendarParser {
  /**
   * Parse les données de calendrier et retourne les événements
   * @param data Les données de calendrier à parser
   * @returns Les événements parsés (génériques)
   */
  parse(data: string): CalendarEvent[];
}

