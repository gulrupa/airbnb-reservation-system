import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Reservation,
  ReservationDocument,
} from '../../infrastructure/database/schemas/reservation.schema';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationRepository {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async findAll(): Promise<ReservationDocument[]> {
    return this.reservationModel.find().exec();
  }

  async findById(id: string): Promise<ReservationDocument | null> {
    return this.reservationModel.findById(id).exec();
  }

  async findByInternalId(internalId: string): Promise<ReservationDocument | null> {
    return this.reservationModel.findOne({ internalId }).exec();
  }

  async findByExternalId(externalId: string): Promise<ReservationDocument | null> {
    return this.reservationModel.findOne({ externalId }).exec();
  }

  async create(data: CreateReservationDto): Promise<ReservationDocument> {
    const internalId = randomUUID();
    const createdReservation = new this.reservationModel({
      ...data,
      internalId,
    });
    return createdReservation.save();
  }

  async update(
    id: string,
    data: UpdateReservationDto,
  ): Promise<ReservationDocument | null> {
    return this.reservationModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.reservationModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findByUserId(userId: string): Promise<ReservationDocument[]> {
    return this.reservationModel.find({ userId }).exec();
  }

  async findByPropertyId(propertyId: string): Promise<ReservationDocument[]> {
    return this.reservationModel.find({ propertyId }).exec();
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({
        $or: [
          {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
          },
        ],
      })
      .exec();
  }

  async findByCalendarUrlId(calendarUrlId: string): Promise<ReservationDocument[]> {
    return this.reservationModel.find({ calendarUrlId }).exec();
  }
}

