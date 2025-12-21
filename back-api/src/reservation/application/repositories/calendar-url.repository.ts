import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CalendarUrl, CalendarUrlDocument } from '../../infrastructure/database/schemas/calendar-url.schema';
import { CreateCalendarUrlDto } from '../dto/create-calendar-url.dto';
import { UpdateCalendarUrlDto } from '../dto/update-calendar-url.dto';

@Injectable()
export class CalendarUrlRepository {
  constructor(
    @InjectModel(CalendarUrl.name)
    private calendarUrlModel: Model<CalendarUrlDocument>,
  ) {}

  async findAll(): Promise<CalendarUrlDocument[]> {
    return this.calendarUrlModel.find().exec();
  }

  async findById(id: string): Promise<CalendarUrlDocument | null> {
    return this.calendarUrlModel.findById(id).exec();
  }

  async findByUrl(url: string): Promise<CalendarUrlDocument | null> {
    return this.calendarUrlModel.findOne({ url }).exec();
  }

  async findByPlatform(platform: string): Promise<CalendarUrlDocument[]> {
    return this.calendarUrlModel.find({ platform, isActive: true }).exec();
  }

  async create(createCalendarUrlDto: CreateCalendarUrlDto): Promise<CalendarUrlDocument> {
    console.log('createCalendarUrlDto', createCalendarUrlDto);
    const createdCalendarUrl = new this.calendarUrlModel(createCalendarUrlDto);
    return createdCalendarUrl.save();
  }

  async update(
    id: string,
    updateCalendarUrlDto: UpdateCalendarUrlDto,
  ): Promise<CalendarUrlDocument | null> {
    return this.calendarUrlModel
      .findByIdAndUpdate(id, updateCalendarUrlDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.calendarUrlModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findActive(): Promise<CalendarUrlDocument[]> {
    return this.calendarUrlModel.find({ isActive: true }).exec();
  }
}

