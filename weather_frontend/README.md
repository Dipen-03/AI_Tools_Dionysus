# Aerogram — a quiet weather dashboard

A small, editorial weather dashboard built for **Assignment 16: Front-end Web App**.
The design goal was to make a weather page that doesn't read like a generic template —
real typography hierarchy, custom SVG weather icons (no off-the-shelf icon pack),
a hand-tuned hourly temperature curve, and dynamic gradient backgrounds driven by
the live weather condition.

## What it does

- **Live weather data** via the free [Open-Meteo](https://open-meteo.com) API — no API key required.
- **City search** with autocomplete from Open-Meteo's geocoding endpoint.
- **Current conditions** — large temperature display, condition label, "feels like", wind direction arrow.
- **Quick-stats row** — humidity, wind, pressure, UV index (with severity coloring), visibility, sunrise/sunset.
- **Hourly forecast** — custom SVG temperature curve for the next 24 hours with weather icons and precip %.
- **7-day forecast** — daily cards with min/max temperature range bars and precip probability.
- **Narrative panel** — short, human-sounding summary of the day built from the live data.
- **Recent cities** — saved to `localStorage`, surfaced as quick-select chips.
- **Graceful fallback** — if the live API is unavailable, the page renders with sample data and a transparent "Demo data" badge.
- **Fully responsive** — desktop, tablet, mobile (390×844 verified).

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui base |
| Animations | Framer Motion + hand-tuned SVG keyframes |
| Charts | Custom SVG (no charting library — keeps the visual identity bespoke) |
| Data | Open-Meteo free API (no key required) |
| State | React hooks + `localStorage` for recent cities |

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
```

Then open the preview. No `.env` file is required — Open-Meteo is keyless.

## Project structure

```
src/
  app/
    layout.tsx          # Inter + Instrument Serif fonts
    page.tsx            # main dashboard composition
    globals.css         # Tailwind theme + custom keyframes
  components/weather/
    city-search.tsx     # debounced autocomplete with keyboard nav
    current-conditions.tsx
    quick-stats.tsx     # 6-card metric grid
    hourly-chart.tsx    # custom SVG temperature curve
    daily-forecast.tsx  # 7-day rows with range bars
    narrative.tsx       # human-sounding day summary
    recent-cities.tsx   # localStorage chip bar
    weather-icon.tsx    # custom SVG weather icons (animated)
    wind-arrow.tsx      # meteorological wind direction arrow
    weather-skeleton.tsx
  hooks/
    use-recent-cities.ts
  lib/weather/
    api.ts              # Open-Meteo fetch + condition description
    types.ts            # shared types
    format.ts           # naive-local-time formatters
    demo-data.ts        # graceful fallback dataset
```

## Screenshots

Three reference screenshots live in `download/`:

1. **`screenshot-1-desktop.png`** — full dashboard on a 1440×1100 viewport (default city: Helsinki).
2. **`screenshot-2-search.png`** — city search autocomplete dropdown showing results for "Tokyo".
3. **`screenshot-3-tokyo.png`** — dashboard showing Tokyo, with Tokyo surfaced in the "Recent" chips.

A bonus mobile screenshot (`screenshot-mobile.png`, 390×844) demonstrates responsive layout.

## Design notes

- **Typography**: Inter for UI, Instrument Serif (italic) for the giant temperature and section headlines — gives the page an editorial, magazine-like feel rather than the usual SaaS look.
- **Custom SVG icons**: every weather icon is hand-drawn SVG with its own micro-animation (spinning sun, drifting cloud, falling rain, snowflakes). No icon-pack dependency for weather.
- **Dynamic background**: the page background gradient is computed from the current weather condition + day/night, then transitions smoothly over 1.2 s when conditions change.
- **Tabular figures**: temperature and time use `tabular-nums` so digits don't jitter on update.
- **Glassmorphism**: cards use `backdrop-blur` + semi-transparent backgrounds, with a subtle inner highlight overlay (`.glass-highlight`) for depth.

## For the assignment submission

- **Live API used**: [Open-Meteo](https://open-meteo.com) — free, no API key, 10,000 calls/day per IP.
- **Agents / LLMs used**: built with Z.ai (GLM) as the AI pair-programmer; design and code reviewed iteratively in the same session.
- **GitHub repo**: push this folder to a new GitHub repository (suggested name: `aerogram-weather-dashboard`).
