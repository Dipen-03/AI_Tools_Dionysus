"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { describeWeather } from "@/lib/weather/api";
import type { CurrentWeather, DailyForecast } from "@/lib/weather/types";

interface NarrativeProps {
  current: CurrentWeather;
  daily: DailyForecast;
  cityName: string;
}

function buildNarrative(
  city: string,
  current: CurrentWeather,
  daily: DailyForecast,
): { headline: string; body: string } {
  const cond = describeWeather(current.weatherCode, current.isDay);
  const tmax = Math.round(daily.temperatureMax[0]);
  const tmin = Math.round(daily.temperatureMin[0]);
  const precip = daily.precipitationProbabilityMax[0];
  const gust = Math.round(current.windGusts);
  const uv = current.uvIndex;

  const headlines: Record<string, string> = {
    clear: "A clean, open sky overhead.",
    "partly-cloudy": "Clouds and sunlight trading places.",
    cloudy: "Soft grey all afternoon.",
    overcast: "A blanket of overcast.",
    fog: "Visibility drops to a whisper.",
    drizzle: "A light, persistent drizzle.",
    rain: "Wet pavement and umbrellas.",
    snow: "Snow is settling in.",
    showers: "On-and-off showers passing through.",
    thunderstorm: "Rumbles building on the horizon.",
  };

  const headline = headlines[cond.slug] ?? cond.label;

  const tempLine = `High of ${tmax}°, low of ${tmin}°`;
  const precipLine =
    precip >= 50
      ? `Rain is likely today (${precip}% chance).`
      : precip >= 25
        ? `A ${precip}% chance of rain — pack a light shell.`
        : `Precipitation looks unlikely (${precip}%).`;
  const windLine =
    gust > 35
      ? `Gusts up to ${gust} km/h — secure loose things on the balcony.`
      : gust > 20
        ? `Breezy, with gusts to ${gust} km/h.`
        : `Light winds, gusting to ${gust} km/h.`;
  const uvLine =
    uv >= 8
      ? `UV hits ${uv.toFixed(1)} — sunscreen is non-negotiable.`
      : uv >= 6
        ? `UV peaks at ${uv.toFixed(1)}, high enough to be careful.`
        : `UV stays modest at ${uv.toFixed(1)}.`;

  const body = `${tempLine}. ${precipLine} ${windLine} ${uvLine} Right now in ${city} it's ${Math.round(
    current.temperature,
  )}° with ${cond.label.toLowerCase()}.`;

  return { headline, body };
}

export function Narrative({ current, daily, cityName }: NarrativeProps) {
  const { headline, body } = buildNarrative(cityName, current, daily);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-6"
      aria-label="Daily narrative"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Today, in short
      </div>
      <p className="mt-3 font-serif text-2xl italic leading-snug text-foreground">
        &ldquo;{headline}&rdquo;
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/70">{body}</p>
    </motion.section>
  );
}
