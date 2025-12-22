export class Annonce {
  internalId: string;
  title: string;
  description?: string;
  address?: string;
  calendarUrlIds: string[];

  constructor(
    internalId: string,
    title: string,
    description?: string,
    address?: string,
    calendarUrlIds: string[] = [],
  ) {
    this.internalId = internalId;
    this.title = title;
    this.description = description;
    this.address = address;
    this.calendarUrlIds = calendarUrlIds;
  }
}

