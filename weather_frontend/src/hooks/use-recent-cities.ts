import { useCallback, useState } from "react";
import type { SavedCity } from "@/lib/weather/types";

const KEY = "aerogram:recent-cities";
const MAX = 5;

function readInitial(): SavedCity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCity[];
  } catch {
    return [];
  }
}

export function useRecentCities() {
  // Lazy initial state — read from localStorage once on first render.
  const [cities, setCities] = useState<SavedCity[]>(readInitial);

  const persist = (next: SavedCity[]) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  };

  const add = useCallback((city: Omit<SavedCity, "addedAt">) => {
    setCities((prev) => {
      const without = prev.filter(
        (c) => !(c.latitude === city.latitude && c.longitude === city.longitude),
      );
      const next = [{ ...city, addedAt: Date.now() }, ...without].slice(0, MAX);
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((lat: number, lon: number) => {
    setCities((prev) => {
      const next = prev.filter((c) => !(c.latitude === lat && c.longitude === lon));
      persist(next);
      return next;
    });
  }, []);

  return { cities, add, remove };
}
