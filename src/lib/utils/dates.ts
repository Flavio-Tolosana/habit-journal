export function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthId(date: string): string {
  return date.substring(0, 7);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDisplayDate(date: string): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const [year, month, day] = date.split('-');
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export function isSameMonth(date1: string, date2: string): boolean {
  return getMonthId(date1) === getMonthId(date2);
}
