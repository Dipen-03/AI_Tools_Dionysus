"use client";

import { Clock, X } from "lucide-react";
import type { SavedCity } from "@/lib/weather/types";

interface RecentCitiesProps {
  cities: SavedCity[];
  onSelect: (city: SavedCity) => void;
  onRemove: (lat: number, lon: number) => void;
}

export function RecentCities({ cities, onSelect, onRemove }: RecentCitiesProps) {
  if (cities.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/45">
        <Clock className="h-3 w-3" />
        Recent
      </span>
      {cities.map((c) => (
        <div
          key={`${c.latitude}-${c.longitude}`}
          className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-foreground/10 bg-background/40 py-1 pl-3 pr-1.5 text-xs backdrop-blur-md transition hover:border-foreground/25 hover:bg-background/70"
        >
          <button
            onClick={() => onSelect(c)}
            className="text-foreground/80 hover:text-foreground"
          >
            {c.name}
            <span className="ml-1 text-foreground/40">{c.country}</span>
          </button>
          <button
            onClick={() => onRemove(c.latitude, c.longitude)}
            className="grid h-4 w-4 place-items-center rounded-full text-foreground/40 transition hover:bg-foreground/10 hover:text-foreground"
            aria-label={`Remove ${c.name}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
