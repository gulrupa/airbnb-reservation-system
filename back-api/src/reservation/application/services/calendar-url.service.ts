import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CalendarUrlRepository } from '../repositories/calendar-url.repository';
import { CalendarUrlDocument } from '../../infrastructure/database/schemas/calendar-url.schema';
import { CreateCalendarUrlDto } from '../dto/create-calendar-url.dto';
import { UpdateCalendarUrlDto } from '../dto/update-calendar-url.dto';

@Injectable()
export class CalendarUrlService {
  constructor(
    private readonly calendarUrlRepository: CalendarUrlRepository,
  ) {}

  async getAllCalendarUrls(): Promise<CalendarUrlDocument[]> {
    return this.calendarUrlRepository.findAll();
  }

  async getCalendarUrlById(id: string): Promise<CalendarUrlDocument> {
    const calendarUrl = await this.calendarUrlRepository.findById(id);
    if (!calendarUrl) {
      throw new NotFoundException(`URL de calendrier avec l'ID ${id} introuvable`);
    }
    return calendarUrl;
  }

  async getCalendarUrlByUrl(url: string): Promise<CalendarUrlDocument | null> {
    return this.calendarUrlRepository.findByUrl(url);
  }

  async getCalendarUrlsByPlatform(
    platform: string,
  ): Promise<CalendarUrlDocument[]> {
    return this.calendarUrlRepository.findByPlatform(platform);
  }

  async getActiveCalendarUrls(): Promise<CalendarUrlDocument[]> {
    return this.calendarUrlRepository.findActive();
  }

  async createCalendarUrl(
    createCalendarUrlDto: CreateCalendarUrlDto,
  ): Promise<CalendarUrlDocument> {
    // Vérifier si l'URL existe déjà
    const existingUrl = await this.calendarUrlRepository.findByUrl(
      createCalendarUrlDto.url,
    );
    if (existingUrl) {
      throw new ConflictException(
        `L'URL ${createCalendarUrlDto.url} existe déjà`,
      );
    }

    return this.calendarUrlRepository.create(createCalendarUrlDto);
  }

  async updateCalendarUrl(
    id: string,
    updateCalendarUrlDto: UpdateCalendarUrlDto,
  ): Promise<CalendarUrlDocument> {
    // Vérifier si l'URL existe
    const existingUrl = await this.calendarUrlRepository.findById(id);
    if (!existingUrl) {
      throw new NotFoundException(`URL de calendrier avec l'ID ${id} introuvable`);
    }

    // Si l'URL est modifiée, vérifier qu'elle n'existe pas déjà
    if (updateCalendarUrlDto.url && updateCalendarUrlDto.url !== existingUrl.url) {
      const urlExists = await this.calendarUrlRepository.findByUrl(
        updateCalendarUrlDto.url,
      );
      if (urlExists) {
        throw new ConflictException(
          `L'URL ${updateCalendarUrlDto.url} existe déjà`,
        );
      }
    }

    const updated = await this.calendarUrlRepository.update(id, updateCalendarUrlDto);
    if (!updated) {
      throw new NotFoundException(`URL de calendrier avec l'ID ${id} introuvable`);
    }
    return updated;
  }

  async deleteCalendarUrl(id: string): Promise<void> {
    const deleted = await this.calendarUrlRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`URL de calendrier avec l'ID ${id} introuvable`);
    }
  }
}

