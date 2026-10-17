// Realistic demo data for when the live API is unavailable.
// Used only as a graceful fallback so the dashboard always renders.
// The badge in the corner clearly marks when this is in use.

import type { WeatherData } from "./types";

export function buildDemoWeather(lat: number, lon: number): WeatherData {
  const now = new Date();
  const isoHours: string[] = [];
  const isoDays: string[] = [];

  // Hourly: next 24h, starting at current hour
  const baseHour = now.getHours();
  for (let i = 0; i < 48; i++) {
    const d = new Date(now);
    d.setHours(baseHour + i, 0, 0, 0);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:00`;
    isoHours.push(iso);
  }

  // Daily: next 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    isoDays.push(iso);
  }

  // A gentle sine wave for temperature variation, plus a per-day offset
  const hourTemps = isoHours.map((_, i) => {
    const h = (baseHour + i) % 24;
    // Peak around 15h, trough around 5h
    const wave = Math.sin(((h - 9) / 24) * Math.PI * 2);
    const base = 14 + wave * 6;
    return Math.round((base + Math.sin(i / 4) * 1.2) * 10) / 10;
  });

  const maxT = Math.max(...hourTemps);
  const minT = Math.min(...hourTemps);

  const dailyMax = isoDays.map((_, i) =>
    Math.round((maxT + Math.sin(i) * 1.5 - i * 0.5) * 10) / 10,
  );
  const dailyMin = isoDays.map((_, i) =>
    Math.round((minT + Math.cos(i) * 1.5 - i * 0.5) * 10) / 10,
  );

  const currentHour = 0; // index in isoHours representing "now"
  const currentTemp = hourTemps[currentHour];
  const isDay = (() => {
    const h = new Date(isoHours[0]).getHours();
    return h >= 6 && h < 19;
  })();

  // Mostly clear with some cloud, occasional showers
  const codes = [1, 2, 3, 45, 61, 80, 95, 0];
  const pickCode = (seed: number) => codes[Math.abs(Math.floor(Math.sin(seed) * codes.length)) % codes.length];

  const sunriseIso = isoDays.map((day) => `${day}T06:24`);
  const sunsetIso = isoDays.map((day) => `${day}T18:42`);

  return {
    timezone: "Europe/Helsinki",
    latitude: lat,
    longitude: lon,
    current: {
      time: isoHours[0],
      temperature: currentTemp,
      apparentTemperature: Math.round((currentTemp - 1.5) * 10) / 10,
      isDay,
      precipitation: 0,
      weatherCode: 2,
      cloudCover: 38,
      pressureMsl: 1018.4,
      windSpeed: 11,
      windDirection: 220,
      windGusts: 23,
      relativeHumidity: 64,
      uvIndex: isDay ? 3.4 : 0,
      visibility: 14200,
    },
    hourly: {
      time: isoHours,
      temperature: hourTemps,
      weatherCode: isoHours.map((_, i) => pickCode(i)),
      precipitationProbability: isoHours.map((_, i) =>
        Math.max(0, Math.round(Math.sin(i / 5) * 60 + 15)),
      ),
    },
    daily: {
      time: isoDays,
      weatherCode: isoDays.map((_, i) => pickCode(i + 100)),
      temperatureMax: dailyMax,
      temperatureMin: dailyMin,
      sunrise: sunriseIso,
      sunset: sunsetIso,
      uvIndexMax: isoDays.map((_, i) => Math.round(Math.sin(i) * 4 + 4.5)),
      precipitationProbabilityMax: isoDays.map((_, i) =>
        Math.max(0, Math.round(Math.cos(i / 2) * 70 + 20)),
      ),
      windSpeedMax: isoDays.map((_, i) => Math.round(15 + Math.sin(i * 1.7) * 8)),
    },
  };
}
