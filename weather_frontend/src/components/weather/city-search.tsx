"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { searchCities } from "@/lib/weather/api";
import type { GeoLocation } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

interface CitySearchProps {
  onSelect: (loc: GeoLocation) => void;
  onClear?: () => void;
  selectedLabel?: string | null;
}

export function CitySearch({
  onSelect,
  onClear,
  selectedLabel,
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchCities(query);
        setResults(r);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function pick(loc: GeoLocation) {
    onSelect(loc);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 h-4 w-4 text-foreground/40"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={selectedLabel && !query ? "" : query}
          placeholder={
            selectedLabel ? `Search… (current: ${selectedLabel})` : "Search a city…"
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-full border border-foreground/10 bg-background/60 px-10 text-sm text-foreground shadow-sm outline-none backdrop-blur-md transition focus:border-foreground/30 focus:bg-background/80 focus:shadow-md"
          aria-label="Search city"
          autoComplete="off"
          spellCheck={false}
        />
        {selectedLabel && onClear && !query && (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className="absolute right-2 grid h-7 w-7 place-items-center rounded-full text-foreground/50 transition hover:bg-foreground/5 hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {loading && (
          <Loader2
            className="absolute right-3 h-4 w-4 animate-spin text-foreground/40"
            aria-hidden
          />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-foreground/10 bg-background/95 shadow-xl backdrop-blur-xl"
          role="listbox"
        >
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === activeIndex}>
              <button
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(r)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition",
                  i === activeIndex ? "bg-foreground/5" : "hover:bg-foreground/3",
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.name}
                  </div>
                  <div className="truncate text-xs text-foreground/55">
                    {[r.admin1, r.country].filter(Boolean).join(", ")}
                  </div>
                </div>
                <span className="text-[10px] tabular-nums text-foreground/40">
                  {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
