import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Statistiques,
  StatistiquesDocument,
} from '../../infrastructure/database/schemas/statistiques.schema';

@Injectable()
export class StatistiquesRepository {
  constructor(
    @InjectModel(Statistiques.name)
    private statistiquesModel: Model<StatistiquesDocument>,
  ) {}

  async findByYear(year: number): Promise<StatistiquesDocument | null> {
    return this.statistiquesModel.findOne({ year }).exec();
  }

  async findLatest(): Promise<StatistiquesDocument | null> {
    const currentYear = new Date().getFullYear();
    return this.findByYear(currentYear);
  }

  async create(data: Partial<Statistiques>): Promise<StatistiquesDocument> {
    const statistiques = new this.statistiquesModel(data);
    return statistiques.save();
  }

  async updateByYear(year: number, data: Partial<Statistiques>): Promise<StatistiquesDocument | null> {
    return this.statistiquesModel
      .findOneAndUpdate({ year }, { ...data, calculatedAt: new Date() }, { new: true, upsert: true })
      .exec();
  }

  async findAllYears(): Promise<number[]> {
    const stats = await this.statistiquesModel.find({}, { year: 1 }).exec();
    return stats.map((s) => s.year).sort();
  }
}

