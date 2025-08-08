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
