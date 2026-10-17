"use client";

import { motion } from "framer-motion";
import { describeWeather } from "@/lib/weather/api";
import type { CurrentWeather } from "@/lib/weather/types";
import { WeatherIcon } from "./weather-icon";
import { WindArrow } from "./wind-arrow";

interface CurrentConditionsProps {
  current: CurrentWeather;
  cityName: string;
  country: string;
  localTime: string;
}

export function CurrentConditions({
  current,
  cityName,
  country,
  localTime,
}: CurrentConditionsProps) {
  const condition = describeWeather(current.weatherCode, current.isDay);
  const roundedTemp = Math.round(current.temperature);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/40 p-7 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.18)] backdrop-blur-xl glass-highlight sm:p-9"
      aria-label="Current conditions"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" />
            Live · {localTime}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {cityName}
            <span className="ml-2 text-base font-normal text-foreground/50">
              {country}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <WindArrow
            direction={current.windDirection}
            speed={Math.round(current.windSpeed)}
          />
        </div>
      </div>

      <div className="mt-7 flex items-end gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28"
        >
          <WeatherIcon
            code={current.weatherCode}
            isDay={current.isDay}
            className="h-full w-full drop-shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
          />
        </motion.div>

        <div className="flex items-start">
          <motion.span
            key={roundedTemp}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-[120px] leading-[0.85] tracking-tighter text-foreground sm:text-[160px]"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {roundedTemp}
          </motion.span>
          <span className="mt-3 text-4xl font-light text-foreground/60">°</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="font-serif text-2xl italic text-foreground/85">
          {condition.label}
        </p>
        <div className="flex items-center gap-2 text-sm text-foreground/65">
          <span className="text-foreground/40">Feels like</span>
          <span className="tabular-nums font-medium text-foreground">
            {Math.round(current.apparentTemperature)}°
          </span>
        </div>
        {current.precipitation > 0 && (
          <div className="flex items-center gap-2 text-sm text-foreground/65">
            <span className="text-foreground/40">Precip.</span>
            <span className="tabular-nums font-medium text-foreground">
              {current.precipitation.toFixed(1)} mm
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}
