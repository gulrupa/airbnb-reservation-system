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

@Injectable()
export class AnnonceService {
  constructor(
    private readonly annonceRepository: AnnonceRepository,
    private readonly calendarUrlRepository: CalendarUrlRepository,
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
}

