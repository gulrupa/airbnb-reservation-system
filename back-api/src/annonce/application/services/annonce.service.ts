import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AnnonceRepository } from '../repositories/annonce.repository';
import { AnnonceDocument } from '../../infrastructure/database/schemas/annonce.schema';
import { CreateAnnonceDto } from '../dto/create-annonce.dto';
import { UpdateAnnonceDto } from '../dto/update-annonce.dto';
import { CalendarUrlRepository } from '../../../reservation/application/repositories/calendar-url.repository';
import { ReservationService } from '../../../reservation/application/services/reservation.service';
import { ReservationDocument } from '../../../reservation/infrastructure/database/schemas/reservation.schema';

@Injectable()
export class AnnonceService {
  constructor(
    private readonly annonceRepository: AnnonceRepository,
    private readonly calendarUrlRepository: CalendarUrlRepository,
    private readonly reservationService: ReservationService,
  ) {}

  async getAllAnnonces(): Promise<AnnonceDocument[]> {
    return this.annonceRepository.findAll();
  }

  async getAnnonceById(id: string): Promise<AnnonceDocument> {
    const annonce = await this.annonceRepository.findById(id);
    if (!annonce) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }
    return annonce;
  }

  async createAnnonce(createAnnonceDto: CreateAnnonceDto): Promise<AnnonceDocument> {
    if (createAnnonceDto.calendarUrlIds && createAnnonceDto.calendarUrlIds.length > 0) {
      await this.validateCalendarUrlIds(createAnnonceDto.calendarUrlIds);
    }

    if (createAnnonceDto.blockedByAnnonceIds && createAnnonceDto.blockedByAnnonceIds.length > 0) {
      await this.validateAnnonceIds(createAnnonceDto.blockedByAnnonceIds);
    }

    return this.annonceRepository.create(createAnnonceDto);
  }

  async updateAnnonce(
    id: string,
    updateAnnonceDto: UpdateAnnonceDto,
  ): Promise<AnnonceDocument> {
    const annonce = await this.annonceRepository.findById(id);
    if (!annonce) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }

    if (updateAnnonceDto.calendarUrlIds && updateAnnonceDto.calendarUrlIds.length > 0) {
      await this.validateCalendarUrlIds(updateAnnonceDto.calendarUrlIds);
    }

    if (updateAnnonceDto.blockedByAnnonceIds && updateAnnonceDto.blockedByAnnonceIds.length > 0) {
      await this.validateAnnonceIds(updateAnnonceDto.blockedByAnnonceIds);
      // Vérifier qu'une annonce ne se bloque pas elle-même
      if (updateAnnonceDto.blockedByAnnonceIds.includes(id)) {
        throw new BadRequestException('Une annonce ne peut pas se bloquer elle-même');
      }
    }

    const updatedAnnonce = await this.annonceRepository.update(id, updateAnnonceDto);
    if (!updatedAnnonce) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }
    return updatedAnnonce;
  }

  async deleteAnnonce(id: string): Promise<void> {
    const deleted = await this.annonceRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }
  }

  /**
   * Vérifie si une annonce est bloquée par d'autres annonces
   * @param annonceId - ID de l'annonce à vérifier
   * @returns true si l'annonce est bloquée, false sinon
   */
  async isBlockedByAnnonces(annonceId: string): Promise<boolean> {
    const annonce = await this.annonceRepository.findById(annonceId);
    if (!annonce) {
      throw new NotFoundException(`Annonce avec l'ID ${annonceId} non trouvée`);
    }

    return (
      annonce.blockedByAnnonceIds && annonce.blockedByAnnonceIds.length > 0
    );
  }

  /**
   * Récupère toutes les indisponibilités (réservations) liées à une annonce.
   * Cela inclut :
   * - Les réservations des calendriers de l'annonce
   * - Les réservations des calendriers des annonces qui bloquent cette annonce
   * @param annonceId - ID de l'annonce
   * @returns Liste de toutes les réservations (indisponibilités) liées à l'annonce
   */
  async getUnavailabilities(annonceId: string): Promise<ReservationDocument[]> {
    const annonce = await this.annonceRepository.findById(annonceId);
    if (!annonce) {
      throw new NotFoundException(`Annonce avec l'ID ${annonceId} non trouvée`);
    }

    // Récupérer tous les calendarUrlIds de l'annonce
    const calendarUrlIds: string[] = [];
    if (annonce.calendarUrlIds && annonce.calendarUrlIds.length > 0) {
      for (const calendarUrlId of annonce.calendarUrlIds) {
        const calendarUrlIdStr =
          typeof calendarUrlId === 'string'
            ? calendarUrlId
            : (calendarUrlId as any)._id?.toString() || calendarUrlId.toString();
        calendarUrlIds.push(calendarUrlIdStr);
      }
    }

    // Récupérer toutes les annonces qui bloquent cette annonce
    if (annonce.blockedByAnnonceIds && annonce.blockedByAnnonceIds.length > 0) {
      for (const blockedAnnonceId of annonce.blockedByAnnonceIds) {
        const blockedAnnonceIdStr =
          typeof blockedAnnonceId === 'string'
            ? blockedAnnonceId
            : (blockedAnnonceId as any)._id?.toString() || blockedAnnonceId.toString();

        const blockedAnnonce = await this.annonceRepository.findById(blockedAnnonceIdStr);
        if (blockedAnnonce && blockedAnnonce.calendarUrlIds) {
          for (const calendarUrlId of blockedAnnonce.calendarUrlIds) {
            const calendarUrlIdStr =
              typeof calendarUrlId === 'string'
                ? calendarUrlId
                : (calendarUrlId as any)._id?.toString() || calendarUrlId.toString();
            if (!calendarUrlIds.includes(calendarUrlIdStr)) {
              calendarUrlIds.push(calendarUrlIdStr);
            }
          }
        }
      }
    }

    // Récupérer toutes les réservations pour ces calendriers
    const allReservations: ReservationDocument[] = [];
    for (const calendarUrlId of calendarUrlIds) {
      const reservations =
        await this.reservationService.getReservationsByCalendarUrlId(calendarUrlId);
      allReservations.push(...reservations);
    }

    // Supprimer les doublons basés sur l'ID de la réservation
    const uniqueReservations = allReservations.filter(
      (reservation, index, self) =>
        index === self.findIndex((r) => r._id.toString() === reservation._id.toString()),
    );

    return uniqueReservations;
  }

  private async validateCalendarUrlIds(calendarUrlIds: string[]): Promise<void> {
    for (const calendarUrlId of calendarUrlIds) {
      const calendarUrl = await this.calendarUrlRepository.findById(calendarUrlId);
      if (!calendarUrl) {
        throw new BadRequestException(
          `CalendarUrl avec l'ID ${calendarUrlId} n'existe pas`,
        );
      }
    }
  }

  private async validateAnnonceIds(annonceIds: string[]): Promise<void> {
    for (const annonceId of annonceIds) {
      const annonce = await this.annonceRepository.findById(annonceId);
      if (!annonce) {
        throw new BadRequestException(
          `Annonce avec l'ID ${annonceId} n'existe pas`,
        );
      }
    }
  }
}

