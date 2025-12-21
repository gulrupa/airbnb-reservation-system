import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AirbnbCalendarEvent } from './interfaces/airbnb-calendar-event.interface';
import { IAirbnbCalendarParser } from './interfaces/airbnb-calendar-parser.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ICAL = require('ical.js');

/**
 * Implémentation spécifique pour parser les calendriers Airbnb en format iCal
 * Utilise ical.js pour parser le format iCal
 */
@Injectable()
export class AirbnbCalendarParser implements IAirbnbCalendarParser {
  private readonly logger = new Logger(AirbnbCalendarParser.name);

  parse(icalData: string): AirbnbCalendarEvent[] {
    try {
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const events: AirbnbCalendarEvent[] = [];
      let parseErrors = 0;

      vevents.forEach((vevent) => {
        try {
          const event = this.parseVEvent(vevent);
          if (event) {
            events.push(event);
          }
        } catch (error) {
          parseErrors++;
        }
      });

      if (parseErrors > 0) {
        this.logger.warn(
          `${parseErrors} événement(s) n'ont pas pu être parsés sur ${vevents.length} événement(s) total`,
        );
      }

      return events;
    } catch (error) {
      throw new HttpException(
        `Erreur lors du parsing du calendrier: ${error.message}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  /**
   * Parse un composant VEVENT iCal
   * @param vevent Le composant VEVENT
   * @returns L'événement parsé ou null
   * @throws HttpException pour les erreurs critiques (comme l'extraction de l'ID externe)
   */
  private parseVEvent(vevent: any): AirbnbCalendarEvent | null {
    const uid = vevent.getFirstPropertyValue('uid') || '';
    
    try {
      const summary = vevent.getFirstPropertyValue('summary') || '';
      const description = vevent.getFirstPropertyValue('description') || '';

      // Parse des dates
      const dtstart = vevent.getFirstPropertyValue('dtstart');
      const dtend = vevent.getFirstPropertyValue('dtend');
      const dtstamp = vevent.getFirstPropertyValue('dtstamp');

      if (!dtstart || !dtend) {
        return null;
      }

      const startDate = this.parseICalDate(dtstart);
      const endDate = this.parseICalDate(dtend);
      const stampDate = dtstamp
        ? this.parseICalDate(dtstamp)
        : new Date();

      // Extraction des informations depuis la description
      const reservationUrl = this.extractReservationUrl(description);
      const phoneNumber = this.extractPhoneNumber(description);
      
      // Vérifier si c'est un "manual block date" (Airbnb (Not available) sans URL de réservation)
      const isManualBlockDate = summary === 'Airbnb (Not available)' && !reservationUrl;
      
      let externalId: string;
      if (isManualBlockDate) {
        // Pour les manual block dates, créer un externalId basé sur l'UID et les dates
        externalId = this.generateManualBlockDateId(uid, startDate, endDate);
      } else {
        // Extraction de l'ID externe directement depuis l'URL de réservation
        // Lance une erreur si l'ID ne peut pas être extrait (erreur critique)
        externalId = this.extractExternalIdFromUrl(reservationUrl);
      }

      return {
        uid,
        startDate,
        endDate,
        summary,
        description: description || undefined,
        reservationUrl,
        phoneNumber,
        externalId,
        dtstamp: stampDate,
        isManualBlockDate,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du parsing de l'événement avec UID: ${uid || 'inconnu'}`
      );
      throw error;
    }
  }

  /**
   * Parse une date au format iCal
   * @param icalDate La date au format iCal
   * @returns Un objet Date
   */
  private parseICalDate(icalDate: any): Date {
    if (typeof icalDate === 'string') {
      // Format: YYYYMMDD ou YYYYMMDDTHHmmssZ
      const dateStr = icalDate.replace(/[-:]/g, '');
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1; // Les mois sont 0-indexés
      const day = parseInt(dateStr.substring(6, 8), 10);

      if (dateStr.length > 8) {
        // Format avec heure
        const hour = parseInt(dateStr.substring(9, 11), 10);
        const minute = parseInt(dateStr.substring(11, 13), 10);
        const second = parseInt(dateStr.substring(13, 15), 10) || 0;
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      }

      return new Date(Date.UTC(year, month, day));
    }

    // Si c'est déjà un objet Date ou un timestamp
    return new Date(icalDate);
  }

  /**
   * Extrait l'URL de réservation depuis la description
   * @param description La description de l'événement
   * @returns L'URL de réservation ou undefined
   */
  private extractReservationUrl(description: string): string | undefined {
    const urlMatch = description.match(
      /Reservation URL:\s*(https?:\/\/[^\s\n]+)/i,
    );
    return urlMatch ? urlMatch[1] : undefined;
  }

  /**
   * Extrait le numéro de téléphone depuis la description
   * @param description La description de l'événement
   * @returns Le numéro de téléphone ou undefined
   */
  private extractPhoneNumber(description: string): string | undefined {
    const phoneMatch = description.match(
      /Phone Number \(Last 4 Digits\):\s*(\d+)/i,
    );
    return phoneMatch ? phoneMatch[1] : undefined;
  }

  /**
   * Extrait l'ID externe depuis l'URL de réservation
   * @param reservationUrl L'URL de réservation
   * @returns L'ID externe extrait de l'URL
   * @throws HttpException si l'ID ne peut pas être extrait
   */
  private extractExternalIdFromUrl(
    reservationUrl: string | undefined,
  ): string {
    // Essayer d'extraire l'ID depuis l'URL de réservation
    if (reservationUrl) {
      const match = reservationUrl.match(/\/details\/([A-Z0-9]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Lancer une erreur si l'ID ne peut pas être extrait
    throw new HttpException(
      'Impossible d\'extraire l\'ID externe depuis l\'URL de réservation',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  /**
   * Génère un ID externe pour les manual block dates
   * @param uid L'UID de l'événement
   * @param startDate La date de début
   * @param endDate La date de fin
   * @returns Un ID externe unique pour le manual block date
   */
  private generateManualBlockDateId(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): string {
    // Créer un ID basé sur l'UID
    const uidPart = uid ? uid.split('@')[0] : 'unknown';
    return `MANUAL_BLOCK_${uidPart}`;
  }
}

