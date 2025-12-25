import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatistiquesController } from './controllers/statistiques.controller';
import { StatistiquesService } from '../application/services/statistiques.service';
import { StatistiquesRepository } from '../application/repositories/statistiques.repository';
import {
  Statistiques,
  StatistiquesSchema,
} from '../infrastructure/database/schemas/statistiques.schema';
import { ReservationModule } from '../../reservation/presentation/reservation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Statistiques.name, schema: StatistiquesSchema },
    ]),
    ReservationModule,
  ],
  controllers: [StatistiquesController],
  providers: [StatistiquesService, StatistiquesRepository],
  exports: [StatistiquesService],
})
export class StatistiquesModule {}

