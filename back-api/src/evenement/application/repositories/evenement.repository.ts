import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Evenement,
  EvenementDocument,
} from '../../infrastructure/database/schemas/evenement.schema';

@Injectable()
export class EvenementRepository {
  constructor(
    @InjectModel(Evenement.name)
    private readonly evenementModel: Model<EvenementDocument>,
  ) {}

  async create(evenement: Partial<Evenement>): Promise<EvenementDocument> {
    const createdEvenement = new this.evenementModel(evenement);
    return createdEvenement.save();
  }

  async findByReservationId(
    reservationId: string,
  ): Promise<EvenementDocument[]> {
    return this.evenementModel.find({ reservationId }).exec();
  }

  async findAll(): Promise<EvenementDocument[]> {
    return this.evenementModel.find().exec();
  }

  async findByType(type: string): Promise<EvenementDocument[]> {
    return this.evenementModel.find({ type }).exec();
  }

  async findNonTraites(): Promise<EvenementDocument[]> {
    return this.evenementModel.find({ traite: { $ne: true } }).exec();
  }

  async markAsTraite(id: string): Promise<EvenementDocument | null> {
    return this.evenementModel
      .findByIdAndUpdate(id, { traite: true }, { new: true })
      .exec();
  }
}

