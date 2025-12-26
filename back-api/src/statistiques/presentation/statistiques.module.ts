import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatistiquesController } from './controllers/statistiques.controller';
import { StatistiquesService } from '../application/services/statistiques.service';
import { StatistiquesRepository } from '../application/repositories/statistiques.repository';
import { StatistiquesMensuellesRepository } from '../application/repositories/statistiques-mensuelles.repository';
import {
  Statistiques,
  StatistiquesSchema,
} from '../infrastructure/database/schemas/statistiques.schema';
import {
  StatistiquesMensuelles,
  StatistiquesMensuellesSchema,
} from '../infrastructure/database/schemas/statistiques-mensuelles.schema';
import { ReservationModule } from '../../reservation/presentation/reservation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Statistiques.name, schema: StatistiquesSchema },
      { name: StatistiquesMensuelles.name, schema: StatistiquesMensuellesSchema },
    ]),
    ReservationModule,
  ],
  controllers: [StatistiquesController],
  providers: [
    StatistiquesService,
    StatistiquesRepository,
    StatistiquesMensuellesRepository,
  ],
  exports: [StatistiquesService],
})
export class StatistiquesModule {}

