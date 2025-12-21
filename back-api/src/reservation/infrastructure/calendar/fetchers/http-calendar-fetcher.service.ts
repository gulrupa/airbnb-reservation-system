import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICalendarFetcher } from '../../../domain/interfaces/calendar-fetcher.interface';

/**
 * Implémentation de ICalendarFetcher utilisant HTTP
 */
@Injectable()
export class HttpCalendarFetcher implements ICalendarFetcher {
  constructor(private readonly httpService: HttpService) {}

  async fetch(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'text',
          timeout: 10000,
        }),
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          `Erreur lors de la récupération du calendrier: ${error.response.statusText}`,
          error.response.status || HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        `Erreur lors de la récupération du calendrier: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

