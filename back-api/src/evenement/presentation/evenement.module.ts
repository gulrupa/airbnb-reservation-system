import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvenementRepository } from '../application/repositories/evenement.repository';
import { EmailFetchService } from '../application/services/email-fetch.service';
import { EmailParserService } from '../application/services/email-parser.service';
import { EmailSyncService } from '../application/services/email-sync.service';
import {
  Evenement,
  EvenementSchema,
} from '../infrastructure/database/schemas/evenement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evenement.name, schema: EvenementSchema },
    ]),
  ],
  providers: [
    EvenementRepository,
    EmailFetchService,
    EmailParserService,
    EmailSyncService,
  ],
  exports: [EvenementRepository, EmailSyncService],
})
export class EvenementModule {}

