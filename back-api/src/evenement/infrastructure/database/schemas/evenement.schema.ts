import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EvenementDocument = Evenement & Document;

export enum EvenementType {
  VERSEMENT = 'versement',
  CREATION = 'creation',
  ANNULATION = 'annulation',
}

@Schema({ timestamps: true, collection: 'evenements' })
export class Evenement {
  @Prop({ required: true, index: true })
  reservationId: string; // ID de la réservation Airbnb (format [A-Z0-9]{10})

  @Prop({ required: true, type: Date })
  dateReception: Date;

  @Prop({ required: true, enum: EvenementType, index: true })
  type: EvenementType;

  @Prop({ type: Number })
  prix?: number; // Prix en euros (optionnel, peut être 0 pour certaines annulations)

  @Prop({ default: false, index: true })
  traite?: boolean; // Indique si l'événement a été traité
}

export const EvenementSchema = SchemaFactory.createForClass(Evenement);

