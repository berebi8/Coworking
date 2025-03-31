export function calculateEndDate(startDate: Date, durationMonths: number): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);
  return endDate;
}

export function calculateContinuousTermStartDate(fixedTermEndDate: Date): Date {
  const startDate = new Date(fixedTermEndDate);
  startDate.setDate(startDate.getDate() + 1);
  return startDate;
}

export function calculateDiscountedPrice(listPrice: number, discountPercentage: number): number {
  return Math.round(listPrice * (1 - discountPercentage / 100));
}

export function calculateSecurityDeposit(monthlyPayment: number): number {
  return monthlyPayment * 2; // Default is 2 months
}

export function calculateTotalMonthlyPayment(
  officeSpaces: { list_price: number; discount_percentage: number }[],
  parkingSpaces: { list_price: number; discount_percentage: number }[],
  services: { list_price: number; discount_percentage: number }[]
): number {
  const officeTotal = officeSpaces.reduce((sum, space) => 
    sum + calculateDiscountedPrice(space.list_price, space.discount_percentage), 0);

  const parkingTotal = parkingSpaces.reduce((sum, space) => 
    sum + calculateDiscountedPrice(space.list_price, space.discount_percentage), 0);

  const servicesTotal = services.reduce((sum, service) => 
    sum + calculateDiscountedPrice(service.list_price, service.discount_percentage), 0);

  return officeTotal + parkingTotal + servicesTotal;
}
