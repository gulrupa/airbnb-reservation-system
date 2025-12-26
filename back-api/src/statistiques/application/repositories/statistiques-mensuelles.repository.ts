import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StatistiquesMensuelles,
  StatistiquesMensuellesDocument,
} from '../../infrastructure/database/schemas/statistiques-mensuelles.schema';

@Injectable()
export class StatistiquesMensuellesRepository {
  constructor(
    @InjectModel(StatistiquesMensuelles.name)
    private statistiquesMensuellesModel: Model<StatistiquesMensuellesDocument>,
  ) {}

  async findByYearAndMonth(year: number, month: number): Promise<StatistiquesMensuellesDocument | null> {
    return this.statistiquesMensuellesModel.findOne({ year, month }).exec();
  }

  async findByYear(year: number): Promise<StatistiquesMensuellesDocument[]> {
    return this.statistiquesMensuellesModel.find({ year }).sort({ month: 1 }).exec();
  }

  async updateByYearAndMonth(
    year: number,
    month: number,
    data: Partial<StatistiquesMensuelles>,
  ): Promise<StatistiquesMensuellesDocument | null> {
    return this.statistiquesMensuellesModel
      .findOneAndUpdate(
        { year, month },
        { ...data, calculatedAt: new Date() },
        { new: true, upsert: true },
      )
      .exec();
  }
}

