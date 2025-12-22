import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnonceController } from './controllers/annonce.controller';
import { AnnonceService } from '../application/services/annonce.service';
import { AnnonceRepository } from '../application/repositories/annonce.repository';
import {
  Annonce,
  AnnonceSchema,
} from '../infrastructure/database/schemas/annonce.schema';
import { ReservationModule } from '../../reservation/presentation/reservation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Annonce.name, schema: AnnonceSchema },
    ]),
    ReservationModule,
  ],
  controllers: [AnnonceController],
  providers: [AnnonceService, AnnonceRepository],
  exports: [AnnonceService],
})
export class AnnonceModule {}

