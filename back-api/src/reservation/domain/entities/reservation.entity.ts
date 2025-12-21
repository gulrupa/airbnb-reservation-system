export class Reservation {
  internalId: string;
  externalId: string;
  price: number;
  startDate: Date;
  endDate: Date;
  numberOfTravelers: number;
  type?: string;

  constructor(
    internalId: string,
    externalId: string,
    price: number,
    startDate: Date,
    endDate: Date,
    numberOfTravelers: number,
    type?: string,
  ) {
    this.internalId = internalId;
    this.externalId = externalId;
    this.price = price;
    this.startDate = startDate;
    this.endDate = endDate;
    this.numberOfTravelers = numberOfTravelers;
    this.type = type || 'reservation';
  }
}

