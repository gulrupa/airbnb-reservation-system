export class Statistiques {
  currentMonthRevenue: number;
  futureRevenue: number;
  yearRevenue: number;
  occupancyRate: number;
  currentMonthReservations: number;
  averageRevenuePerReservation: number;
  averageRevenuePerNight: number;
  totalNights: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  calculatedAt: Date;

  constructor(
    currentMonthRevenue: number,
    futureRevenue: number,
    yearRevenue: number,
    occupancyRate: number,
    currentMonthReservations: number,
    averageRevenuePerReservation: number,
    averageRevenuePerNight: number,
    totalNights: number,
    monthlyRevenue: Array<{ month: string; revenue: number }>,
    calculatedAt: Date,
  ) {
    this.currentMonthRevenue = currentMonthRevenue;
    this.futureRevenue = futureRevenue;
    this.yearRevenue = yearRevenue;
    this.occupancyRate = occupancyRate;
    this.currentMonthReservations = currentMonthReservations;
    this.averageRevenuePerReservation = averageRevenuePerReservation;
    this.averageRevenuePerNight = averageRevenuePerNight;
    this.totalNights = totalNights;
    this.monthlyRevenue = monthlyRevenue;
    this.calculatedAt = calculatedAt;
  }
}

