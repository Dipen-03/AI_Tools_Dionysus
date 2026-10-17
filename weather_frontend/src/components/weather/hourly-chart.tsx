"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { HourlyForecast } from "@/lib/weather/types";
import { describeWeather } from "@/lib/weather/api";
import { formatLocalTime } from "@/lib/weather/format";
import { WeatherIcon } from "./weather-icon";

interface HourlyChartProps {
  hourly: HourlyForecast;
  now: Date;
}

// Returns the index in `hourly.time` that corresponds to the current hour.
function findCurrentHourIndex(times: string[], now: Date): number {
  const nowHours = now.getHours();
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i].length === 10 ? `${times[i]}T00:00` : times[i]);
    if (t.getHours() === nowHours) return i;
  }
  return 0;
}

export function HourlyChart({ hourly, now }: HourlyChartProps) {
  const startIdx = findCurrentHourIndex(hourly.time, now);
  const hours = 24;

  // Slice next 24 hours
  const slice = useMemo(() => {
    const end = Math.min(startIdx + hours, hourly.time.length);
    return {
      time: hourly.time.slice(startIdx, end),
      temp: hourly.temperature.slice(startIdx, end),
      code: hourly.weatherCode.slice(startIdx, end),
      precip: hourly.precipitationProbability.slice(startIdx, end),
    };
  }, [hourly, startIdx]);

  // Curve geometry
  const w = 880;
  const h = 200;
  const padX = 24;
  const padY = 36;

  const min = Math.min(...slice.temp);
  const max = Math.max(...slice.temp);
  const range = Math.max(max - min, 4);
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const points = slice.temp.map((t, i) => {
    const x = padX + (i / (slice.temp.length - 1)) * innerW;
    const y = padY + (1 - (t - min) / range) * innerH;
    return { x, y, t };
  });

  // Smoothed curve via Catmull-Rom → Bezier
  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY + 20} L ${points[0].x} ${h - padY + 20} Z`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-6"
      aria-label="Hourly forecast"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
            Next 24 hours
          </h2>
          <p className="mt-1 font-serif text-xl text-foreground/85">
            Temperature curve &amp; conditions
          </p>
        </div>
        <div className="hidden items-center gap-3 text-xs text-foreground/55 sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
            Peak {Math.round(max)}°
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
            Low {Math.round(min)}°
          </span>
        </div>
      </header>

      <div className="hourly-scroll overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-[200px] w-full min-w-[880px]"
          role="img"
          aria-label="Temperature curve for the next 24 hours"
        >
          <defs>
            <linearGradient id="hourly-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(244, 114, 182)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(186, 230, 253)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="hourly-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* horizontal guides */}
          {[0, 0.5, 1].map((g) => (
            <line
              key={g}
              x1={padX}
              x2={w - padX}
              y1={padY + g * innerH}
              y2={padY + g * innerH}
              stroke="currentColor"
              className="text-foreground/10"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#hourly-area)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#hourly-line)"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* data points + labels */}
          {points.map((p, i) => {
            const time = slice.time[i];
            const code = slice.code[i];
            const precip = slice.precip[i];
            const isDay = (() => {
              const h = new Date(time.length === 10 ? `${time}T00:00` : time).getHours();
              return h >= 6 && h < 19;
            })();
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  fill="white"
                  stroke="url(#hourly-line)"
                  strokeWidth={1.5}
                />
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="fill-foreground tabular-nums"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {Math.round(p.t)}°
                </text>
                {i % 2 === 0 && (
                  <text
                    x={p.x}
                    y={h - 6}
                    textAnchor="middle"
                    className="fill-foreground/55 tabular-nums"
                    style={{ fontSize: 10 }}
                  >
                    {formatLocalTime(time, "ha")}
                  </text>
                )}
                {precip >= 30 && (
                  <text
                    x={p.x}
                    y={h - 18}
                    textAnchor="middle"
                    className="fill-sky-500"
                    style={{ fontSize: 9, fontWeight: 600 }}
                  >
                    {precip}%
                  </text>
                )}
                {/* embed the SVG weather icon as a foreignObject */}
                <foreignObject
                  x={p.x - 14}
                  y={p.y + 8}
                  width={28}
                  height={28}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <WeatherIcon
                      code={code}
                      isDay={isDay}
                      animated={false}
                      className="h-6 w-6"
                    />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </motion.section>
  );
}
