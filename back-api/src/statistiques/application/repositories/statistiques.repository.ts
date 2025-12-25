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

  async findLatest(): Promise<StatistiquesDocument | null> {
    return this.statistiquesModel.findOne().sort({ calculatedAt: -1 }).exec();
  }

  async create(data: Partial<Statistiques>): Promise<StatistiquesDocument> {
    const statistiques = new this.statistiquesModel(data);
    return statistiques.save();
  }

  async deleteByDate(date: Date): Promise<boolean> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(normalizedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await this.statistiquesModel
      .deleteMany({
        calculatedAt: { $gte: normalizedDate, $lt: tomorrow },
      })
      .exec();
    return (result.deletedCount || 0) > 0;
  }

  async deleteOld(keepDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const result = await this.statistiquesModel
      .deleteMany({ calculatedAt: { $lt: cutoffDate } })
      .exec();
    return result.deletedCount || 0;
  }
}

