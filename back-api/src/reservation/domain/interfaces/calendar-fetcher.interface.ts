/**
 * Interface pour récupérer les données de calendrier depuis une source externe
 * Respecte le principe d'inversion de dépendance (DIP)
 */
export interface ICalendarFetcher {
  /**
   * Récupère les données iCal depuis une URL
   * @param url L'URL du calendrier iCal
   * @returns Les données iCal brutes
   */
  fetch(url: string): Promise<string>;
}

