import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CalendarUrlDocument = CalendarUrl & Document;

@Schema({ timestamps: true, collection: 'calendar_urls' })
export class CalendarUrl {
  @Prop({ required: true, unique: true })
  url: string;

  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  platform: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CalendarUrlSchema = SchemaFactory.createForClass(CalendarUrl);

