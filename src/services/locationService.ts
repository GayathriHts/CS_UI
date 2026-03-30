import locationData from '../data/locationData';

export function getCountries(): string[] {
  return Object.keys(locationData).sort();
}

export function getStates(country: string): string[] {
  if (!country || !locationData[country]) return [];
  return Object.keys(locationData[country]).sort();
}

export function getCities(country: string, state: string): string[] {
  if (!country || !state || !locationData[country]?.[state]) return [];
  return [...locationData[country][state]].sort();
}
