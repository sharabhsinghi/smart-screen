export type OpenMeteoGeocodingResult = {
  id?: number;
  name: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type OpenMeteoGeocodingResponse = {
  results?: OpenMeteoGeocodingResult[];
};

export type WeatherCitySuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export function parseCityQuery(city: string) {
  return city
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function formatResolvedCity(location: Pick<OpenMeteoGeocodingResult, "name" | "admin1" | "country">) {
  const parts = [location.name, location.admin1, location.country].filter(Boolean);
  return parts.join(", ");
}

function toWeatherCitySuggestion(location: OpenMeteoGeocodingResult): WeatherCitySuggestion {
  const label = formatResolvedCity(location);
  const fallbackId = `${label}:${location.latitude}:${location.longitude}`;

  return {
    id: String(location.id ?? fallbackId),
    label,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export async function searchWeatherCities(query: string, count = 5): Promise<WeatherCitySuggestion[]> {
  const normalizedQuery = parseCityQuery(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  const geocodeRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=${count}&language=en&format=json`
  );

  if (!geocodeRes.ok) {
    throw new Error(`Geocoding HTTP ${geocodeRes.status}`);
  }

  const geocodeData = (await geocodeRes.json()) as OpenMeteoGeocodingResponse;
  const seen = new Set<string>();

  return (geocodeData.results ?? []).reduce<WeatherCitySuggestion[]>((accumulator, location) => {
    const suggestion = toWeatherCitySuggestion(location);

    if (seen.has(suggestion.label)) {
      return accumulator;
    }

    seen.add(suggestion.label);
    accumulator.push(suggestion);
    return accumulator;
  }, []);
}

export async function resolveWeatherCity(city: string): Promise<WeatherCitySuggestion> {
  const [location] = await searchWeatherCities(city, 1);

  if (!location) {
    throw new Error("City not found");
  }

  return location;
}