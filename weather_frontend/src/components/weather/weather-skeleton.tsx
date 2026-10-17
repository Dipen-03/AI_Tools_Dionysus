"use client";

export function WeatherSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-56 animate-pulse rounded-[28px] bg-white/40 backdrop-blur-xl sm:h-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-white/40 backdrop-blur-md"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-white/40 backdrop-blur-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl bg-white/40 backdrop-blur-xl" />
        <div className="h-80 animate-pulse rounded-3xl bg-white/40 backdrop-blur-xl" />
      </div>
    </div>
  );
}
