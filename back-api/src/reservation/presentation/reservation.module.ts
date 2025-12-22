import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationController } from './controllers/reservation.controller';
import { CalendarUrlController } from './controllers/calendar-url.controller';
import { ReservationService } from '../application/services/reservation.service';
import { CalendarUrlService } from '../application/services/calendar-url.service';
import { CalendarSyncService } from '../application/services/calendar-sync.service';
import { ReservationRepository } from '../application/repositories/reservation.repository';
import { CalendarUrlRepository } from '../application/repositories/calendar-url.repository';
import { AirbnbCalendarService } from '../application/services/airbnb/airbnb-calendar.service';
import { HttpCalendarFetcher } from '../infrastructure/calendar/fetchers/http-calendar-fetcher.service';
import { AirbnbCalendarParser } from '../infrastructure/calendar/parsers/airbnb/airbnb-ical-calendar-parser.service';
import { AirbnbReservationMapper } from '../infrastructure/mappers/airbnb/airbnb-reservation-mapper';
import { ICalendarFetcher } from '../domain/interfaces/calendar-fetcher.interface';
import { IAirbnbCalendarParser } from '../infrastructure/calendar/parsers/airbnb/interfaces/airbnb-calendar-parser.interface';
import { IAirbnbReservationMapper } from '../infrastructure/mappers/airbnb/interfaces/airbnb-reservation-mapper.interface';
import {
  CalendarUrl,
  CalendarUrlSchema,
} from '../infrastructure/database/schemas/calendar-url.schema';
import {
  Reservation,
  ReservationSchema,
} from '../infrastructure/database/schemas/reservation.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: CalendarUrl.name, schema: CalendarUrlSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [ReservationController, CalendarUrlController],
  providers: [
    ReservationService,
    ReservationRepository,
    CalendarUrlService,
    CalendarUrlRepository,
    CalendarSyncService,
    // Injection des implémentations concrètes avec leurs interfaces génériques
    {
      provide: 'ICalendarFetcher',
      useClass: HttpCalendarFetcher,
    },
    // Injection de l'implémentation spécifique Airbnb pour le parser
    {
      provide: 'IAirbnbCalendarParser',
      useClass: AirbnbCalendarParser,
    },
    // Injection de l'implémentation spécifique Airbnb pour le mapper
    {
      provide: 'IAirbnbReservationMapper',
      useClass: AirbnbReservationMapper,
    },
    // Service principal qui utilise les interfaces spécifiques Airbnb
    {
      provide: AirbnbCalendarService,
      useFactory: (
        fetcher: ICalendarFetcher,
        parser: IAirbnbCalendarParser,
        mapper: IAirbnbReservationMapper,
      ) => {
        return new AirbnbCalendarService(fetcher, parser, mapper);
      },
      inject: ['ICalendarFetcher', 'IAirbnbCalendarParser', 'IAirbnbReservationMapper'],
    },
  ],
  exports: [
    ReservationService,
    AirbnbCalendarService,
    CalendarUrlRepository,
  ],
})
export class ReservationModule {}

