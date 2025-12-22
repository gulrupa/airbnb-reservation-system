import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnonceDocument = Annonce & Document;

@Schema({ timestamps: true, collection: 'annonces' })
export class Annonce {
  @Prop({ required: true, unique: true })
  internalId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  address?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'CalendarUrl' }], default: [] })
  calendarUrlIds: Types.ObjectId[];
}

export const AnnonceSchema = SchemaFactory.createForClass(Annonce);

