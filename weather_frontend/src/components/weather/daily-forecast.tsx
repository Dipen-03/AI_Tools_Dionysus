"use client";

import { motion } from "framer-motion";
import type { DailyForecast } from "@/lib/weather/types";
import { describeWeather } from "@/lib/weather/api";
import { formatLocalTime } from "@/lib/weather/format";
import { WeatherIcon } from "./weather-icon";

interface DailyForecastRowProps {
  daily: DailyForecast;
}

export function DailyForecastRow({ daily }: DailyForecastRowProps) {
  const days = daily.time.length;
  // Overall min/max across the week for bar scaling
  const allMin = Math.min(...daily.temperatureMin);
  const allMax = Math.max(...daily.temperatureMax);
  const span = allMax - allMin;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-6"
      aria-label="7-day forecast"
    >
      <header className="mb-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
          7-day outlook
        </h2>
        <p className="mt-1 font-serif text-xl text-foreground/85">
          The week ahead
        </p>
      </header>

      <ul className="divide-y divide-foreground/5">
        {Array.from({ length: days }).map((_, i) => {
          const time = daily.time[i];
          const code = daily.weatherCode[i];
          const tmin = daily.temperatureMin[i];
          const tmax = daily.temperatureMax[i];
          const isToday = i === 0;
          const cond = describeWeather(code, true);

          const leftPct = ((tmin - allMin) / span) * 100;
          const widthPct = ((tmax - tmin) / span) * 100;

          return (
            <li
              key={time}
              className="grid grid-cols-[88px_36px_1fr_64px] items-center gap-3 py-3 sm:grid-cols-[120px_44px_1fr_88px] sm:gap-4"
            >
              <div>
                <div className="text-sm font-medium text-foreground">
                  {isToday ? "Today" : formatLocalTime(time, "weekday-short")}
                </div>
                <div className="text-xs text-foreground/50">
                  {isToday ? formatLocalTime(time, "weekday-short+date") : cond.label}
                </div>
              </div>

              <div className="flex justify-center">
                <WeatherIcon
                  code={code}
                  isDay
                  animated={!isToday}
                  className="h-8 w-8"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="w-7 text-right text-xs tabular-nums text-foreground/50">
                  {Math.round(tmin)}°
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/8">
                  <motion.div
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.3 + i * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      marginLeft: `${leftPct}%`,
                      width: `${Math.max(widthPct, 12)}%`,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                  />
                </div>
                <span className="w-7 text-sm tabular-nums font-medium text-foreground">
                  {Math.round(tmax)}°
                </span>
              </div>

              <div className="text-right text-xs text-foreground/55">
                {daily.precipitationProbabilityMax[i] >= 20 ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
                    {daily.precipitationProbabilityMax[i]}%
                  </span>
                ) : (
                  <span className="text-foreground/35">—</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
