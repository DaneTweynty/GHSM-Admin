export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const addMinutes = (hhmm: string, delta: number): string => toHHMM(toMinutes(hhmm) + delta);

export const floorToHour = (hhmm: string): string => {
  const [h] = hhmm.split(':');
  return `${h}:00`;
};

export const roundToQuarter = (hhmm: string): string => {
  const mins = toMinutes(hhmm);
  const quarter = Math.round(mins / 15) * 15;
  return toHHMM(quarter);
};

export const floorToQuarter = (hhmm: string): string => {
  const mins = toMinutes(hhmm);
  const quarter = Math.floor(mins / 15) * 15;
  return toHHMM(quarter);
};

export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  const aS = toMinutes(aStart);
  const aE = toMinutes(aEnd);
  const bS = toMinutes(bStart);
  const bE = toMinutes(bEnd);
  return aS < bE && aE > bS; // half-open overlap
};

// Format HH:MM (24h) to h:mm AM/PM
export const to12Hour = (hhmm: string): string => {
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const range12Hour = (start: string, end: string): string => `${to12Hour(start)}–${to12Hour(end)}`;
