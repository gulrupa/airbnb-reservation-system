export class Reservation {
  internalId: string;
  externalId: string;
  price: number;
  startDate: Date;
  endDate: Date;
  numberOfTravelers: number;

  constructor(
    internalId: string,
    externalId: string,
    price: number,
    startDate: Date,
    endDate: Date,
    numberOfTravelers: number,
  ) {
    this.internalId = internalId;
    this.externalId = externalId;
    this.price = price;
    this.startDate = startDate;
    this.endDate = endDate;
    this.numberOfTravelers = numberOfTravelers;
  }
}

