// Generate a unique document ID with format DOC-YYYYMMDD-XXXX
export function generateDocId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `DOC-${year}${month}${day}-${random}`;
}

// Format date to dd/mm/yy
export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

// Calculate duration in months and days
export function calculateDuration(startDate: string, endDate: string): { months: number; days: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set both dates to the first of their respective months to calculate full months
  const startCopy = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCopy = new Date(end.getFullYear(), end.getMonth(), 1);

  // Calculate full months difference
  let months = (endCopy.getFullYear() - startCopy.getFullYear()) * 12;
  months += endCopy.getMonth() - startCopy.getMonth();

  // If end date is greater than or equal to start date's day, count as a full month
  if (end.getDate() >= start.getDate()) {
    months += 1;
    // Calculate remaining days
    const lastMonthStart = new Date(start);
    lastMonthStart.setMonth(lastMonthStart.getMonth() + months - 1);
    const days = end.getDate() - start.getDate() + 1;
    return { months: months - 1, days };
  } else {
    // If end date is less than start date's day, count previous month
    const lastMonthStart = new Date(start);
    lastMonthStart.setMonth(lastMonthStart.getMonth() + months - 1);
    const days = end.getDate() - start.getDate() + 1;
    return { months, days: days + 31 };
  }
}
