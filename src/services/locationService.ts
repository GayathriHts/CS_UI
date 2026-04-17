import locationData from '../data/locationData';

const COUNTRIES_NOW_BASE = 'https://countriesnow.space/api/v0.1';

const ALLOWED_COUNTRIES = ['India', 'United States'];

export async function fetchCountries(): Promise<string[]> {
  return Object.keys(locationData)
    .filter(n => ALLOWED_COUNTRIES.includes(n))
    .sort((a, b) => a.localeCompare(b));
}

export async function fetchStates(country: string): Promise<string[]> {
  if (!country || !locationData[country]) return [];
  return [...new Set(Object.keys(locationData[country]))]
    .sort((a, b) => a.localeCompare(b));
}

export async function fetchCities(country: string, state: string): Promise<string[]> {
  if (!country || !state || !locationData[country]?.[state]) return [];
  return [...new Set(locationData[country][state])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

const ALLOWED_PHONE_CODES = ['IN', 'US'];

let phoneCodesCache: { name: string; code: string; dial_code: string; flag: string }[] | null = null;

export async function fetchCountryPhoneCodes(): Promise<{ name: string; code: string; dial_code: string; flag: string }[]> {
  if (phoneCodesCache) return phoneCodesCache;
  const res = await fetch(`${COUNTRIES_NOW_BASE}/countries/codes`);
  if (!res.ok) throw new Error('Failed to fetch country phone codes');
  const json = await res.json();
  if (json.error) throw new Error(json.msg || 'API error');
  const flagMap: Record<string, string> = { IN: '🇮🇳', US: '🇺🇸' };
  const codes = (json.data as { name: string; code: string; dial_code: string }[])
    .filter(c => c.dial_code && ALLOWED_PHONE_CODES.includes(c.code))
    .map(c => ({ ...c, flag: flagMap[c.code] || '' }))
    .sort((a, b) => a.name.localeCompare(b.name));
  phoneCodesCache = codes;
  return codes;
}
