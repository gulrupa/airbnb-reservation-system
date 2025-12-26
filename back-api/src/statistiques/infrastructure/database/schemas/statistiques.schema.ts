import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StatistiquesDocument = Statistiques & Document;

@Schema({ timestamps: true })
export class Statistiques {
  @Prop({ required: true, type: Number })
  currentMonthRevenue: number;

  @Prop({ required: true, type: Number })
  futureRevenue: number;

  @Prop({ required: true, type: Number })
  yearRevenue: number;

  @Prop({ required: true, type: Number })
  occupancyRate: number;

  @Prop({ required: true, type: Number })
  currentMonthOccupancyRate: number;

  @Prop({ required: true, type: Number })
  currentMonthReservations: number;

  @Prop({ required: true, type: Number })
  averageRevenuePerReservation: number;

  @Prop({ required: true, type: Number })
  averageRevenuePerNight: number;

  @Prop({ required: true, type: Number })
  averageReservationDuration: number;

  @Prop({ required: true, type: Number })
  currentMonthAveragePricePerNight: number;

  @Prop({ required: true, type: Number })
  currentMonthAverageReservationDuration: number;

  @Prop({ required: true, type: Number })
  totalNights: number;

  @Prop({
    required: true,
    type: [
      {
        month: String,
        revenue: Number,
      },
    ],
  })
  monthlyRevenue: Array<{ month: string; revenue: number }>;

  @Prop({ required: true, type: Date })
  calculatedAt: Date;
}

export const StatistiquesSchema = SchemaFactory.createForClass(Statistiques);

// Index unique pour s'assurer qu'il n'y a qu'une seule statistique par jour
StatistiquesSchema.index({ calculatedAt: 1 }, { unique: true });

