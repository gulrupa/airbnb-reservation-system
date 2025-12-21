export class CalendarUrl {
  _id?: string;
  url: string;
  name?: string;
  description?: string;
  platform: string; // 'airbnb', 'booking', etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    url: string,
    platform: string,
    name?: string,
    description?: string,
    isActive: boolean = true,
  ) {
    this.url = url;
    this.platform = platform;
    this.name = name;
    this.description = description;
    this.isActive = isActive;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

