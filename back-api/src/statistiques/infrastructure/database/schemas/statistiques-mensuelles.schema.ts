import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StatistiquesMensuellesDocument = StatistiquesMensuelles & Document;

@Schema({ timestamps: true })
export class StatistiquesMensuelles {
  @Prop({ required: true, type: Number, index: true })
  year: number;

  @Prop({ required: true, type: Number, index: true })
  month: number; // 0-11 (janvier = 0)

  @Prop({ required: true, type: Number })
  revenue: number;

  @Prop({ required: true, type: Number })
  reservations: number;

  @Prop({ required: true, type: Number })
  occupancyRate: number;

  @Prop({ required: true, type: Number })
  averagePricePerNight: number;

  @Prop({ required: true, type: Number })
  averageReservationDuration: number;

  @Prop({ required: true, type: Date })
  calculatedAt: Date;
}

export const StatistiquesMensuellesSchema = SchemaFactory.createForClass(StatistiquesMensuelles);

// Index unique pour s'assurer qu'il n'y a qu'une seule statistique par année/mois
StatistiquesMensuellesSchema.index({ year: 1, month: 1 }, { unique: true });

