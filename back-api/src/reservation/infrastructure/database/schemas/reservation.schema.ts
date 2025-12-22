import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true, collection: 'reservations' })
export class Reservation {
  @Prop({ required: true, unique: true })
  internalId: string;

  @Prop({ required: true, index: true })
  externalId: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, index: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  endDate: Date;

  @Prop({ required: true })
  numberOfTravelers: number;

  @Prop({ index: true })
  userId?: string;

  @Prop({ index: true })
  propertyId?: string;

  @Prop()
  platform?: string; // 'airbnb', 'booking', etc.

  @Prop({ default: 'reservation' })
  type?: string; // 'reservation', 'manual_block_date'

  @Prop({ type: Types.ObjectId, ref: 'CalendarUrl', index: true })
  calendarUrlId?: Types.ObjectId;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

