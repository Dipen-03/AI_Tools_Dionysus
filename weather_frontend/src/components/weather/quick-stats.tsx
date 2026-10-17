"use client";

import { motion } from "framer-motion";
import {
  Droplets,
  Gauge,
  Eye,
  SunMedium,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import type { CurrentWeather, DailyForecast } from "@/lib/weather/types";
import { formatLocalTime } from "@/lib/weather/format";

interface QuickStatsProps {
  current: CurrentWeather;
  daily: DailyForecast;
}

function uvLabel(uv: number): { label: string; color: string } {
  if (uv < 3) return { label: "Low", color: "text-emerald-600" };
  if (uv < 6) return { label: "Moderate", color: "text-amber-600" };
  if (uv < 8) return { label: "High", color: "text-orange-600" };
  if (uv < 11) return { label: "Very high", color: "text-rose-600" };
  return { label: "Extreme", color: "text-fuchsia-700" };
}

function visibilityLabel(m: number): string {
  if (m >= 10000) return "Excellent";
  if (m >= 4000) return "Good";
  if (m >= 1000) return "Moderate";
  return "Poor";
}

export function QuickStats({ current, daily }: QuickStatsProps) {
  const uv = uvLabel(current.uvIndex);
  const sunrise = formatLocalTime(daily.sunrise[0], "HH:mm");
  const sunset = formatLocalTime(daily.sunset[0], "HH:mm");

  const stats = [
    {
      icon: Droplets,
      label: "Humidity",
      value: `${current.relativeHumidity}%`,
      hint:
        current.relativeHumidity > 75
          ? "Muggy"
          : current.relativeHumidity < 30
            ? "Dry"
            : "Comfortable",
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${Math.round(current.windSpeed)}`,
      unit: "km/h",
      hint: `Gusts ${Math.round(current.windGusts)} km/h`,
    },
    {
      icon: Gauge,
      label: "Pressure",
      value: `${Math.round(current.pressureMsl)}`,
      unit: "hPa",
      hint:
        current.pressureMsl > 1015
          ? "Stable"
          : current.pressureMsl < 1005
            ? "Low, changeable"
            : "Normal",
    },
    {
      icon: SunMedium,
      label: "UV index",
      value: current.uvIndex.toFixed(1),
      hint: uv.label,
      hintClassName: uv.color,
    },
    {
      icon: Eye,
      label: "Visibility",
      value:
        current.visibility >= 1000
          ? `${(current.visibility / 1000).toFixed(1)}`
          : `${current.visibility}`,
      unit: current.visibility >= 1000 ? "km" : "m",
      hint: visibilityLabel(current.visibility),
    },
    {
      icon: current.isDay ? Sunset : Sunrise,
      label: current.isDay ? "Sunset" : "Sunrise",
      value: current.isDay ? sunset : sunrise,
      hint: current.isDay
        ? `Rise ${sunrise}`
        : `Set ${sunset}`,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      aria-label="Detailed metrics"
    >
      {stats.map((s, i) => (
        <article
          key={s.label}
          className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/40 p-4 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 hover:bg-white/60 hover:shadow-[0_4px_16px_-6px_rgba(15,23,42,0.18)]"
        >
          <div className="flex items-center gap-2 text-foreground/55">
            <s.icon className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
              {s.label}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className="tabular-nums text-2xl font-semibold tracking-tight text-foreground"
              style={{ fontFeatureSettings: '"tnum"' }}
            >
              {s.value}
            </span>
            {s.unit && (
              <span className="text-xs font-medium text-foreground/45">
                {s.unit}
              </span>
            )}
          </div>
          <p
            className={`mt-1 text-xs ${s.hintClassName ?? "text-foreground/55"}`}
          >
            {s.hint}
          </p>
        </article>
      ))}
    </motion.section>
  );
}
