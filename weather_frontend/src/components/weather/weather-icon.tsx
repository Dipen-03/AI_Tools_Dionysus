"use client";

import { describeWeather } from "@/lib/weather/api";

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
  animated?: boolean;
}

/**
 * Custom-drawn weather icons — SVG-only, no Lucide fallback.
 * Each condition has its own hand-tuned path so the dashboard
 * doesn't read like a generic icon-pack.
 */
export function WeatherIcon({
  code,
  isDay = true,
  className,
  animated = true,
}: WeatherIconProps) {
  const { slug } = describeWeather(code, isDay);

  const props = {
    className,
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  switch (slug) {
    case "clear":
      return isDay ? <SunIcon {...props} animated={animated} /> : <MoonIcon {...props} animated={animated} />;
    case "partly-cloudly":
    case "partly-cloudy":
      return <PartlyCloudyIcon {...props} isDay={isDay} animated={animated} />;
    case "cloudy":
    case "overcast":
      return <CloudyIcon {...props} animated={animated} />;
    case "fog":
      return <FogIcon {...props} animated={animated} />;
    case "drizzle":
      return <DrizzleIcon {...props} animated={animated} />;
    case "rain":
    case "showers":
      return <RainIcon {...props} animated={animated} />;
    case "snow":
      return <SnowIcon {...props} animated={animated} />;
    case "thunderstorm":
      return <ThunderstormIcon {...props} animated={animated} />;
    default:
      return <CloudyIcon {...props} animated={animated} />;
  }
}

type SvgProps = React.SVGProps<SVGSVGElement> & { animated?: boolean };

function SunIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="sun-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <g
        style={
          animated
            ? { transformOrigin: "32px 32px", animation: "wi-spin 24s linear infinite" }
            : undefined
        }
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          const x1 = 32 + Math.cos(angle) * 18;
          const y1 = 32 + Math.sin(angle) * 18;
          const x2 = 32 + Math.cos(angle) * 26;
          const y2 = 32 + Math.sin(angle) * 26;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
      </g>
      <circle cx="32" cy="32" r="13" fill="url(#sun-grad)" />
      <circle cx="28" cy="28" r="3" fill="#fff7e6" opacity="0.6" />
    </svg>
  );
}

function MoonIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="moon-grad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>
      <g
        style={
          animated
            ? { transformOrigin: "32px 32px", animation: "wi-float 6s ease-in-out infinite" }
            : undefined
        }
      >
        <path
          d="M40 12 A22 22 0 1 0 52 38 A16 16 0 0 1 40 12 Z"
          fill="url(#moon-grad)"
        />
        <circle cx="36" cy="22" r="2" fill="#94a3b8" opacity="0.5" />
        <circle cx="42" cy="32" r="1.5" fill="#94a3b8" opacity="0.5" />
        <circle cx="34" cy="30" r="1" fill="#94a3b8" opacity="0.4" />
      </g>
      <g fill="#fff" opacity="0.85">
        <circle cx="12" cy="18" r="1.2" />
        <circle cx="54" cy="14" r="1" />
        <circle cx="50" cy="52" r="1.5" />
        <circle cx="14" cy="48" r="1" />
      </g>
    </svg>
  );
}

function CloudShape({
  fill = "#cbd5e1",
  stroke = "#94a3b8",
}: {
  fill?: string;
  stroke?: string;
}) {
  return (
    <path
      d="M20 44 C12 44 8 38 12 32 C12 26 18 24 22 28 C24 22 32 22 36 26 C40 22 50 24 50 32 C56 32 58 38 54 44 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );
}

function PartlyCloudyIcon({
  isDay,
  animated = true,
  ...props
}: SvgProps & { isDay: boolean }) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="pc-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      {isDay && (
        <g
          style={
            animated
              ? { transformOrigin: "22px 22px", animation: "wi-spin 30s linear infinite" }
              : undefined
          }
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={22 + Math.cos(angle) * 12}
                y1={22 + Math.sin(angle) * 12}
                x2={22 + Math.cos(angle) * 17}
                y2={22 + Math.sin(angle) * 17}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.8}
              />
            );
          })}
          <circle cx="22" cy="22" r="9" fill="url(#pc-sun)" />
        </g>
      )}
      <g
        style={
          animated
            ? { animation: "wi-float 6s ease-in-out infinite" }
            : undefined
        }
      >
        <CloudShape fill="#f1f5f9" stroke="#94a3b8" />
      </g>
    </svg>
  );
}

function CloudyIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <g
        style={
          animated ? { animation: "wi-drift 8s ease-in-out infinite" } : undefined
        }
      >
        <CloudShape fill="#e2e8f0" stroke="#94a3b8" />
      </g>
    </svg>
  );
}

function FogIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <CloudShape fill="#e2e8f0" stroke="#94a3b8" />
      <g
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      >
        <line x1="14" y1="50" x2="50" y2="50">
          {animated && (
            <animate
              attributeName="x1"
              values="14;18;14"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </line>
        <line x1="10" y1="56" x2="46" y2="56" />
        <line x1="18" y1="62" x2="54" y2="62" />
      </g>
    </svg>
  );
}

function DrizzleIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <CloudShape fill="#cbd5e1" stroke="#64748b" />
      <g fill="#60a5fa">
        {[44, 32, 22].map((y, i) => {
          const x = 26 + i * 8;
          return (
            <circle key={i} cx={x} cy={y} r="1.5">
              {animated && (
                <animate
                  attributeName="cy"
                  values={`${y};${y + 14};${y}`}
                  dur="1.8s"
                  begin={`${i * 0.3}s`}
                  repeatCount="indefinite"
                  opacity="0;1;0"
                />
              )}
            </circle>
          );
        })}
      </g>
    </svg>
  );
}

function RainIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <CloudShape fill="#94a3b8" stroke="#475569" />
      <g stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
        {[24, 32, 40].map((x, i) =>
          animated ? (
            <line key={i} x1={x} y1={46} x2={x - 2} y2={54}>
              <animate
                attributeName="y1"
                values="46;60"
                dur="1.4s"
                begin={`${i * 0.2}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="54;68"
                dur="1.4s"
                begin={`${i * 0.2}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;1;0"
                dur="1.4s"
                begin={`${i * 0.2}s`}
                repeatCount="indefinite"
              />
            </line>
          ) : (
            <line key={i} x1={x} y1={46} x2={x - 2} y2={54} />
          ),
        )}
      </g>
    </svg>
  );
}

function SnowIcon({ animated = true, ...props }: SvgProps) {
  const flakes = [
    { x: 24, y: 48 },
    { x: 32, y: 52 },
    { x: 40, y: 48 },
    { x: 28, y: 58 },
    { x: 36, y: 58 },
  ];
  return (
    <svg {...props}>
      <CloudShape fill="#e2e8f0" stroke="#94a3b8" />
      <g fill="#e0f2fe" stroke="#bae6fd" strokeWidth="0.5">
        {flakes.map((f, i) =>
          animated ? (
            <circle key={i} cx={f.x} cy={f.y} r="1.8">
              <animate
                attributeName="cy"
                values={`${f.y};${f.y + 14}`}
                dur="2.4s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;1;0"
                dur="2.4s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ) : (
            <circle key={i} cx={f.x} cy={f.y} r="1.8" />
          ),
        )}
      </g>
    </svg>
  );
}

function ThunderstormIcon({ animated = true, ...props }: SvgProps) {
  return (
    <svg {...props}>
      <CloudShape fill="#475569" stroke="#1e293b" />
      <path
        d="M30 46 L24 58 L30 58 L26 68 L40 54 L34 54 L38 46 Z"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="0.5"
      >
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}
