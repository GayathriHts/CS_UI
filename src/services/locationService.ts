const COUNTRIES_NOW_BASE = 'https://countriesnow.space/api/v0.1';

// Simple in-memory cache to avoid redundant API calls
const cache: { countries: string[] | null; states: Record<string, string[]>; cities: Record<string, string[]> } = {
  countries: null,
  states: {},
  cities: {},
};

export async function fetchCountries(): Promise<string[]> {
  if (cache.countries) return cache.countries;
  const res = await fetch(`${COUNTRIES_NOW_BASE}/countries/states`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  const json = await res.json();
  if (json.error) throw new Error(json.msg || 'API error');
  const countries: string[] = json.data.map((c: { name: string }) => c.name).sort();
  cache.countries = countries;
  // Also cache states from this same response
  for (const c of json.data) {
    const stateNames: string[] = (c.states || []).map((s: { name: string }) => s.name).sort();
    cache.states[c.name] = stateNames;
  }
  return countries;
}

export async function fetchStates(country: string): Promise<string[]> {
  if (!country) return [];
  if (cache.states[country]) return cache.states[country];
  // If countries were already fetched, states should be cached. Fetch if not.
  const res = await fetch(`${COUNTRIES_NOW_BASE}/countries/states`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (json.error) return [];
  const states: string[] = (json.data?.states || []).map((s: { name: string }) => s.name).sort();
  cache.states[country] = states;
  return states;
}

export async function fetchCities(country: string, state: string): Promise<string[]> {
  if (!country || !state) return [];
  const key = `${country}|${state}`;
  if (cache.cities[key]) return cache.cities[key];
  const res = await fetch(`${COUNTRIES_NOW_BASE}/countries/state/cities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, state }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (json.error) return [];
  const cities: string[] = (json.data || []).filter((c: string) => c).sort();
  cache.cities[key] = cities;
  return cities;
}
