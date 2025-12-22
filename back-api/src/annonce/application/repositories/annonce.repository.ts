import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Annonce,
  AnnonceDocument,
} from '../../infrastructure/database/schemas/annonce.schema';
import { CreateAnnonceDto } from '../dto/create-annonce.dto';
import { UpdateAnnonceDto } from '../dto/update-annonce.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AnnonceRepository {
  constructor(
    @InjectModel(Annonce.name)
    private annonceModel: Model<AnnonceDocument>,
  ) {}

  async findAll(): Promise<AnnonceDocument[]> {
    return this.annonceModel
      .find()
      .populate('calendarUrlIds')
      .populate('blockedByAnnonceIds')
      .exec();
  }

  async findById(id: string): Promise<AnnonceDocument | null> {
    return this.annonceModel
      .findById(id)
      .populate('calendarUrlIds')
      .populate('blockedByAnnonceIds')
      .exec();
  }

  async findByInternalId(internalId: string): Promise<AnnonceDocument | null> {
    return this.annonceModel
      .findOne({ internalId })
      .populate('calendarUrlIds')
      .populate('blockedByAnnonceIds')
      .exec();
  }

  async create(data: CreateAnnonceDto): Promise<AnnonceDocument> {
    const internalId = randomUUID();
    const createdAnnonce = new this.annonceModel({
      ...data,
      internalId,
      calendarUrlIds: data.calendarUrlIds || [],
      blockedByAnnonceIds: data.blockedByAnnonceIds || [],
    });
    return createdAnnonce.save();
  }

  async update(
    id: string,
    data: UpdateAnnonceDto,
  ): Promise<AnnonceDocument | null> {
    return this.annonceModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('calendarUrlIds')
      .populate('blockedByAnnonceIds')
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.annonceModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}

