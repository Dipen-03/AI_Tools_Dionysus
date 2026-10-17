import type {
  CurrentWeather,
  DailyForecast,
  GeoLocation,
  HourlyForecast,
  WeatherData,
} from "./types";

// Open-Meteo — free, no API key required. https://open-meteo.com

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function searchCities(query: string): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data = await res.json();
  return (data.results ?? []) as GeoLocation[];
}

export async function getWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());

  // Current conditions
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "uv_index",
      "visibility",
    ].join(","),
  );

  // Hourly for next 24h chart
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
    ].join(","),
  );

  // Daily for 7-day forecast
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
  );

  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("wind_speed_unit", "kmh");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Forecast request failed: ${res.status}`);

  const data = await res.json();

  const current: CurrentWeather = {
    time: data.current.time,
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    isDay: data.current.is_day === 1,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    cloudCover: data.current.cloud_cover,
    pressureMsl: data.current.pressure_msl,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    windGusts: data.current.wind_gusts_10m,
    relativeHumidity: data.current.relative_humidity_2m,
    uvIndex: data.current.uv_index,
    visibility: data.current.visibility,
  };

  const hourly: HourlyForecast = {
    time: data.hourly.time,
    temperature: data.hourly.temperature_2m,
    weatherCode: data.hourly.weather_code,
    precipitationProbability: data.hourly.precipitation_probability,
  };

  const daily: DailyForecast = {
    time: data.daily.time,
    weatherCode: data.daily.weather_code,
    temperatureMax: data.daily.temperature_2m_max,
    temperatureMin: data.daily.temperature_2m_min,
    sunrise: data.daily.sunrise,
    sunset: data.daily.sunset,
    uvIndexMax: data.daily.uv_index_max,
    precipitationProbabilityMax: data.daily.precipitation_probability_max,
    windSpeedMax: data.daily.wind_speed_10m_max,
  };

  return {
    current,
    hourly,
    daily,
    timezone: data.timezone,
    latitude,
    longitude,
  };
}

// WMO weather code → human-readable label + slug for icon/background selection.
export interface WeatherCondition {
  label: string;
  slug:
    | "clear"
    | "partly-cloudy"
    | "cloudy"
    | "overcast"
    | "fog"
    | "drizzle"
    | "rain"
    | "snow"
    | "showers"
    | "thunderstorm";
}

export function describeWeather(code: number, isDay = true): WeatherCondition {
  // Reference: https://open-meteo.com/en/docs (WMO weather interpretation codes)
  if (code === 0)
    return { label: isDay ? "Clear sky" : "Clear night", slug: "clear" };
  if (code === 1)
    return { label: "Mainly clear", slug: "partly-cloudy" };
  if (code === 2) return { label: "Partly cloudy", slug: "partly-cloudy" };
  if (code === 3) return { label: "Overcast", slug: "overcast" };
  if (code === 45 || code === 48) return { label: "Fog", slug: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", slug: "drizzle" };
  if (code >= 61 && code <= 65) return { label: "Rain", slug: "rain" };
  if (code >= 66 && code <= 67) return { label: "Freezing rain", slug: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", slug: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", slug: "showers" };
  if (code === 85 || code === 86) return { label: "Snow showers", slug: "snow" };
  if (code >= 95) return { label: "Thunderstorm", slug: "thunderstorm" };
  return { label: "Cloudy", slug: "cloudy" };
}

// Build a background gradient string driven by the current condition + day/night.
// We deliberately avoid generic Tailwind-blue; instead we use warmer editorial tones.
export function conditionBackground(
  slug: WeatherCondition["slug"],
  isDay: boolean,
): { from: string; via: string; to: string; accent: string } {
  if (!isDay) {
    // Night — deep slate with cool moonlit accents
    return {
      from: "#0b1220",
      via: "#141b2d",
      to: "#1a1430",
      accent: "#c7d2fe",
    };
  }

  switch (slug) {
    case "clear":
      // Warm dawn/dusk-ish sky — peach to cream
      return {
        from: "#fde9c8",
        via: "#fcd9b6",
        to: "#f5e6d3",
        accent: "#f97316",
      };
    case "partly-cloudy":
      return {
        from: "#e8edf2",
        via: "#f0e7d8",
        to: "#f5ede0",
        accent: "#0ea5e9",
      };
    case "cloudy":
    case "overcast":
      return {
        from: "#dde3ea",
        via: "#e6e9ee",
        to: "#d6dde4",
        accent: "#64748b",
      };
    case "fog":
      return {
        from: "#e5e7eb",
        via: "#eef0f2",
        to: "#dfe3e8",
        accent: "#94a3b8",
      };
    case "drizzle":
    case "rain":
    case "showers":
      return {
        from: "#cfd8e3",
        via: "#dde4ed",
        to: "#cdd6e0",
        accent: "#0891b2",
      };
    case "snow":
      return {
        from: "#eef2f7",
        via: "#f5f8fb",
        to: "#e3e9f1",
        accent: "#7c3aed",
      };
    case "thunderstorm":
      return {
        from: "#475569",
        via: "#3f4a5d",
        to: "#2f3744",
        accent: "#fbbf24",
      };
    default:
      return {
        from: "#f5f5f4",
        via: "#fafaf9",
        to: "#f5f5f4",
        accent: "#0ea5e9",
      };
  }
}
