import { Injectable, Logger } from '@nestjs/common';
import { EmailMessage } from './email-fetch.service';
import { EvenementType } from '../../domain/entities/evenement.entity';

export interface ParsedEmailEvent {
  reservationId: string;
  type: EvenementType;
  prix?: number;
}

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  parseEmail(email: EmailMessage): ParsedEmailEvent | null {
    const subject = email.subject || '';
    const body = email.body || email.html || '';

    // Extraire l'ID de réservation (format [A-Z0-9]{10})
    const reservationIdMatch = body.match(/\b([A-Z0-9]{10})\b/);
    if (!reservationIdMatch) {
      this.logger.warn(
        `Aucun ID de réservation trouvé dans l'email avec le sujet: ${subject}`,
      );
      return null;
    }

    const reservationId = reservationIdMatch[1];

    // Déterminer le type d'événement et extraire le prix
    if (subject.includes('Nous avons envoyé un versement')) {
      return this.parseVersement(subject, reservationId);
    } else if (subject.includes('Réservation confirmée')) {
      return this.parseCreation(body, reservationId);
    } else if (subject.includes('Annulation de la réservation')) {
      return this.parseAnnulation(body, reservationId);
    }

    // Email non reconnu, ignoré
    this.logger.debug(`Email ignoré avec le sujet: ${subject}`);
    return null;
  }

  private parseVersement(
    subject: string,
    reservationId: string,
  ): ParsedEmailEvent {
    // Format: "Nous avons envoyé un versement de 124,74 € EUR"
    const prixMatch = subject.match(/versement de ([\d,]+)\s*€/);
    let prix: number | undefined;

    if (prixMatch) {
      prix = parseFloat(prixMatch[1].replace(',', '.'));
    }

    return {
      reservationId,
      type: EvenementType.VERSEMENT,
      prix,
    };
  }

  private parseCreation(
    body: string,
    reservationId: string,
  ): ParsedEmailEvent {
    // Format: "VOUS GAGNEZ   478,14=C2=A0=E2=82=AC"
    // Le format =C2=A0=E2=82=AC est l'encodage Quoted-Printable pour " €"
    // Mailparser devrait décoder automatiquement, mais on garde les deux patterns pour sécurité
    let prix: number | undefined;

    // Essayer de trouver le prix avec encodage Quoted-Printable (si pas décodé)
    const prixMatchEncoded = body.match(
      /VOUS\s+GAGNEZ\s+([\d,]+)(?:=C2=A0=E2=82=AC|€)/i,
    );
    if (prixMatchEncoded) {
      prix = parseFloat(prixMatchEncoded[1].replace(',', '.'));
    } else {
      // Essayer sans encodage (format normal décodé)
      const prixMatch = body.match(/VOUS\s+GAGNEZ\s+([\d,]+)\s*€/i);
      if (prixMatch) {
        prix = parseFloat(prixMatch[1].replace(',', '.'));
      }
    }

    return {
      reservationId,
      type: EvenementType.CREATION,
      prix,
    };
  }

  private parseAnnulation(
    body: string,
    reservationId: string,
  ): ParsedEmailEvent {
    // Vérifier si c'est un remboursement total
    const remboursementTotalMatch = body.match(
      /Conform=C3=A9ment =C3=A0 vos conditions d'annulation, un remboursement total a =C3=A9t=C3=A9 envoy=C3=A9 au voyageur/i,
    );

    if (remboursementTotalMatch) {
      return {
        reservationId,
        type: EvenementType.ANNULATION,
        prix: 0,
      };
    }

    // Format: "Son montant est maintenant de 189,90=C2=A0=E2==82=AC"
    // Note: il y a une double égal dans l'exemple fourni, probablement une erreur de copie
    // Mailparser devrait décoder automatiquement, mais on garde les deux patterns pour sécurité
    let prix: number | undefined;

    // Essayer de trouver le prix avec encodage Quoted-Printable (si pas décodé)
    const prixMatchEncoded = body.match(
      /Son\s+montant\s+est\s+maintenant\s+de\s+([\d,]+)(?:=C2=A0=E2(=?)82=AC|€)/i,
    );
    if (prixMatchEncoded) {
      prix = parseFloat(prixMatchEncoded[1].replace(',', '.'));
    } else {
      // Essayer sans encodage (format normal décodé)
      const prixMatch = body.match(/Son\s+montant\s+est\s+maintenant\s+de\s+([\d,]+)\s*€/i);
      if (prixMatch) {
        prix = parseFloat(prixMatch[1].replace(',', '.'));
      }
    }

    return {
      reservationId,
      type: EvenementType.ANNULATION,
      prix,
    };
  }
}

