"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { conditionBackground, describeWeather, getWeather } from "@/lib/weather/api";
import { buildDemoWeather } from "@/lib/weather/demo-data";
import type { GeoLocation, SavedCity, WeatherData } from "@/lib/weather/types";
import { formatLocalTime } from "@/lib/weather/format";
import { useRecentCities } from "@/hooks/use-recent-cities";
import { CitySearch } from "@/components/weather/city-search";
import { CurrentConditions } from "@/components/weather/current-conditions";
import { QuickStats } from "@/components/weather/quick-stats";
import { HourlyChart } from "@/components/weather/hourly-chart";
import { DailyForecastRow } from "@/components/weather/daily-forecast";
import { Narrative } from "@/components/weather/narrative";
import { RecentCities } from "@/components/weather/recent-cities";
import { WeatherSkeleton } from "@/components/weather/weather-skeleton";

interface SelectedCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Sensible default so the page renders with real data on first paint
const DEFAULT_CITY: SelectedCity = {
  name: "Helsinki",
  country: "Finland",
  latitude: 60.1699,
  longitude: 24.9384,
};

export default function Home() {
  const [selected, setSelected] = useState<SelectedCity | null>(DEFAULT_CITY);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const { cities, add, remove } = useRecentCities();

  const fetchWeather = useCallback(async (city: SelectedCity) => {
    setLoading(true);
    setError(null);
    setDemoMode(false);
    try {
      const data = await getWeather(city.latitude, city.longitude);
      setWeather(data);
    } catch (e) {
      // Graceful fallback — render demo data so the dashboard always shows
      // something useful. Surface this transparently with a "demo" badge.
      const msg = e instanceof Error ? e.message : "Couldn't load weather.";
      if (msg.includes("429") || msg.includes("failed")) {
        setWeather(buildDemoWeather(city.latitude, city.longitude));
        setDemoMode(true);
        setError(null);
      } else {
        setError(msg);
        setWeather(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) fetchWeather(selected);
  }, [selected, fetchWeather]);

  function handleSelect(loc: GeoLocation) {
    const city: SelectedCity = {
      name: loc.name,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
    setSelected(city);
    add({ name: loc.name, country: loc.country, latitude: loc.latitude, longitude: loc.longitude });
  }

  function handleRecent(city: SavedCity) {
    setSelected({
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    });
  }

  // Compute background gradient from current conditions
  const bg = weather
    ? conditionBackground(
        describeWeather(weather.current.weatherCode, weather.current.isDay).slug,
        weather.current.isDay,
      )
    : { from: "#f5f5f4", via: "#fafaf9", to: "#f5f5f4", accent: "#0ea5e9" };

  const localTime = weather ? formatLocalTime(weather.current.time, "HH:mm") : "--:--";

  return (
    <main
      className="bg-weather relative min-h-screen w-full font-sans text-foreground"
      style={{
        background: `radial-gradient(120% 80% at 80% 0%, ${bg.via} 0%, ${bg.from} 45%, ${bg.to} 100%)`,
      }}
    >
      {/* Subtle grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-12">
        {/* Top bar */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/90 text-background shadow-sm"
              aria-hidden
            >
              <span className="font-serif text-lg italic leading-none">a</span>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Aerogram
              </h1>
              <p className="text-xs text-foreground/55">
                A quiet weather dashboard
              </p>
            </div>
            {demoMode && (
              <span
                className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-100/70 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 backdrop-blur-sm"
                title="Live API unavailable; showing sample data so the layout is visible."
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                Demo data
              </span>
            )}
          </div>
          <div className="w-full max-w-md sm:w-80">
            <CitySearch
              onSelect={handleSelect}
              onClear={() => setSelected(null)}
              selectedLabel={
                selected ? `${selected.name}, ${selected.country}` : null
              }
            />
          </div>
        </header>

        <div className="mb-4">
          <RecentCities cities={cities} onSelect={handleRecent} onRemove={remove} />
        </div>

        {/* Body */}
        {error ? (
          <ErrorState message={error} onRetry={() => selected && fetchWeather(selected)} />
        ) : loading || !weather || !selected ? (
          <WeatherSkeleton />
        ) : (
          <div className="space-y-4">
            <CurrentConditions
              current={weather.current}
              cityName={selected.name}
              country={selected.country}
              localTime={localTime}
            />

            <QuickStats current={weather.current} daily={weather.daily} />

            <HourlyChart hourly={weather.hourly} now={new Date()} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Narrative
                current={weather.current}
                daily={weather.daily}
                cityName={selected.name}
              />
              <DailyForecastRow daily={weather.daily} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-foreground/10 pt-5 text-xs text-foreground/45">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Weather data by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Open-Meteo
              </a>
              . Built with Next.js, TypeScript &amp; Tailwind.
            </p>
            <p>
              {selected ? `${selected.name} · ${weather?.timezone ?? ""}` : ""}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/40 bg-white/40 p-12 text-center backdrop-blur-xl"
    >
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <div>
        <p className="font-serif text-2xl text-foreground">
          The forecast went missing
        </p>
        <p className="mt-2 text-sm text-foreground/60">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </button>
    </motion.div>
  );
}
