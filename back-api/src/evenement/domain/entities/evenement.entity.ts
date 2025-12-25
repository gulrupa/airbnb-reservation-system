export enum EvenementType {
  VERSEMENT = 'versement',
  CREATION = 'creation',
  ANNULATION = 'annulation',
}

export class Evenement {
  reservationId: string;
  dateReception: Date;
  type: EvenementType;
  prix?: number;
}

