interface WindArrowProps {
  direction: number; // degrees
  speed: number;
  className?: string;
}

export function WindArrow({ direction, speed, className }: WindArrowProps) {
  // Wind direction in meteorology = direction the wind is COMING FROM.
  // Arrow should point in the direction the wind is blowing TO, so +180.
  const arrowAngle = direction + 180;
  const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(direction / 45) % 8
  ];

  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      title={`Wind from ${compass} at ${speed} km/h`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ transform: `rotate(${arrowAngle}deg)` }}
        aria-hidden
      >
        <path
          d="M7 1 L11 9 L7 7 L3 9 Z"
          fill="currentColor"
          opacity="0.85"
        />
      </svg>
      <span className="tabular-nums">
        {speed}
        <span className="text-foreground/40"> km/h</span>
      </span>
      <span className="text-foreground/40">{compass}</span>
    </span>
  );
}
