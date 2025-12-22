import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ReservationRepository } from '../repositories/reservation.repository';
import { ReservationDocument } from '../../infrastructure/database/schemas/reservation.schema';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async getAllReservations(): Promise<ReservationDocument[]> {
    return this.reservationRepository.findAll();
  }

  async getReservationById(id: string): Promise<ReservationDocument> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} introuvable`);
    }
    return reservation;
  }

  async getReservationByExternalId(
    externalId: string,
  ): Promise<ReservationDocument | null> {
    return this.reservationRepository.findByExternalId(externalId);
  }

  async createReservation(
    data: CreateReservationDto,
  ): Promise<ReservationDocument> {
    // Validation des dates
    this.validateDates(data.startDate, data.endDate);

    // Validation du prix
    if (data.price < 0) {
      throw new BadRequestException('Le prix ne peut pas être négatif');
    }

    // Validation du nombre de voyageurs
    if (data.numberOfTravelers < 1) {
      throw new BadRequestException(
        'Le nombre de voyageurs doit être au moins 1',
      );
    }

    // Vérifier si une réservation avec le même externalId existe déjà
    const existingReservation =
      await this.reservationRepository.findByExternalId(data.externalId);
    if (existingReservation) {
      throw new ConflictException(
        `Une réservation avec l'externalId ${data.externalId} existe déjà`,
      );
    }

    return this.reservationRepository.create(data);
  }

  async updateReservation(
    id: string,
    data: UpdateReservationDto,
  ): Promise<ReservationDocument> {
    // Vérifier si la réservation existe
    const existingReservation = await this.reservationRepository.findById(id);
    if (!existingReservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} introuvable`);
    }

    // Validation des dates si elles sont fournies
    const startDate = data.startDate || existingReservation.startDate;
    const endDate = data.endDate || existingReservation.endDate;
    this.validateDates(startDate, endDate);

    // Validation du prix si fourni
    if (data.price !== undefined && data.price < 0) {
      throw new BadRequestException('Le prix ne peut pas être négatif');
    }

    // Validation du nombre de voyageurs si fourni
    if (data.numberOfTravelers !== undefined && data.numberOfTravelers < 1) {
      throw new BadRequestException(
        'Le nombre de voyageurs doit être au moins 1',
      );
    }

    // Vérifier si l'externalId est modifié et s'il existe déjà
    if (data.externalId && data.externalId !== existingReservation.externalId) {
      const reservationWithExternalId =
        await this.reservationRepository.findByExternalId(data.externalId);
      if (reservationWithExternalId) {
        throw new ConflictException(
          `Une réservation avec l'externalId ${data.externalId} existe déjà`,
        );
      }
    }

    const updated = await this.reservationRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Réservation avec l'ID ${id} introuvable`);
    }
    return updated;
  }

  async deleteReservation(id: string): Promise<void> {
    const deleted = await this.reservationRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Réservation avec l'ID ${id} introuvable`);
    }
  }

  async getReservationsByUserId(userId: string): Promise<ReservationDocument[]> {
    return this.reservationRepository.findByUserId(userId);
  }

  async getReservationsByPropertyId(
    propertyId: string,
  ): Promise<ReservationDocument[]> {
    return this.reservationRepository.findByPropertyId(propertyId);
  }

  async getReservationsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<ReservationDocument[]> {
    this.validateDates(startDate, endDate);
    return this.reservationRepository.findByDateRange(startDate, endDate);
  }

  async getReservationsByCalendarUrlId(
    calendarUrlId: string,
  ): Promise<ReservationDocument[]> {
    return this.reservationRepository.findByCalendarUrlId(calendarUrlId);
  }

  /**
   * Valide que les dates sont cohérentes
   * @param startDate Date de début
   * @param endDate Date de fin
   * @throws BadRequestException si les dates sont invalides
   */
  private validateDates(startDate: Date, endDate: Date): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new BadRequestException('La date de début est invalide');
    }

    if (isNaN(end.getTime())) {
      throw new BadRequestException('La date de fin est invalide');
    }

    if (start >= end) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }
  }
}

