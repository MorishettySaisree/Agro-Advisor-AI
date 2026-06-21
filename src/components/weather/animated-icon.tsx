import type { WeatherKind } from "@/lib/weather-utils";

interface Props {
  kind: WeatherKind;
  size?: number;
  className?: string;
}

/**
 * Pure-SVG animated weather icons. No external deps.
 * Each variant has gentle, looping motion. Sized via prop.
 */
export function AnimatedWeatherIcon({ kind, size = 96, className }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 120 120", className };

  switch (kind) {
    case "clear":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id="sun-g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE9A8" />
              <stop offset="60%" stopColor="#FFC247" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>
          <g style={{ transformOrigin: "60px 60px", animation: "wx-spin 22s linear infinite" }}>
            {[...Array(12)].map((_, i) => (
              <rect key={i} x="58" y="6" width="4" height="14" rx="2" fill="#FBBF24"
                transform={`rotate(${i * 30} 60 60)`} opacity="0.85" />
            ))}
          </g>
          <circle cx="60" cy="60" r="26" fill="url(#sun-g)" style={{ animation: "wx-pulse 3s ease-in-out infinite" }} />
        </svg>
      );

    case "partly-cloudy":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id="psun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE9A8" /><stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
            <linearGradient id="pcloud" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
          <circle cx="42" cy="42" r="20" fill="url(#psun)" style={{ animation: "wx-pulse 3s ease-in-out infinite" }} />
          <g style={{ animation: "wx-drift 6s ease-in-out infinite" }}>
            <ellipse cx="72" cy="74" rx="32" ry="18" fill="url(#pcloud)" />
            <ellipse cx="58" cy="70" rx="18" ry="14" fill="url(#pcloud)" />
            <ellipse cx="86" cy="70" rx="14" ry="11" fill="url(#pcloud)" />
          </g>
        </svg>
      );

    case "cloudy":
    case "fog":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="cl" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" /><stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <g style={{ animation: "wx-drift 7s ease-in-out infinite" }}>
            <ellipse cx="60" cy="60" rx="38" ry="20" fill="url(#cl)" />
            <ellipse cx="42" cy="54" rx="20" ry="16" fill="url(#cl)" />
            <ellipse cx="78" cy="54" rx="18" ry="14" fill="url(#cl)" />
          </g>
          {kind === "fog" && (
            <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" opacity="0.7">
              <line x1="22" y1="90" x2="98" y2="90" style={{ animation: "wx-fog 4s ease-in-out infinite" }} />
              <line x1="30" y1="100" x2="90" y2="100" style={{ animation: "wx-fog 4s ease-in-out infinite 0.5s" }} />
            </g>
          )}
        </svg>
      );

    case "drizzle":
    case "rain":
    case "heavy-rain":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="rc" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" /><stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>
          <g style={{ animation: "wx-drift 7s ease-in-out infinite" }}>
            <ellipse cx="60" cy="46" rx="38" ry="18" fill="url(#rc)" />
            <ellipse cx="44" cy="42" rx="18" ry="14" fill="url(#rc)" />
            <ellipse cx="78" cy="42" rx="16" ry="12" fill="url(#rc)" />
          </g>
          {[
            { x: 40, d: 0 },
            { x: 56, d: 0.3 },
            { x: 72, d: 0.6 },
            { x: 88, d: 0.2 },
            ...(kind === "heavy-rain" ? [{ x: 32, d: 0.5 }, { x: 64, d: 0.8 }] : []),
          ].map((r, i) => (
            <line key={i} x1={r.x} y1="70" x2={r.x - 4} y2="86" stroke="#38BDF8" strokeWidth="3"
              strokeLinecap="round" style={{ animation: `wx-rain 1.1s linear infinite ${r.d}s` }} />
          ))}
        </svg>
      );

    case "thunderstorm":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="tc" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#CBD5E1" /><stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <g style={{ animation: "wx-drift 6s ease-in-out infinite" }}>
            <ellipse cx="60" cy="46" rx="40" ry="18" fill="url(#tc)" />
            <ellipse cx="42" cy="40" rx="20" ry="14" fill="url(#tc)" />
            <ellipse cx="80" cy="40" rx="16" ry="12" fill="url(#tc)" />
          </g>
          <polygon points="56,64 70,64 60,82 74,82 50,108 58,88 46,88" fill="#FACC15"
            style={{ animation: "wx-flash 2.2s ease-in-out infinite" }} />
        </svg>
      );

    case "snow":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="sc" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" /><stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <g style={{ animation: "wx-drift 7s ease-in-out infinite" }}>
            <ellipse cx="60" cy="46" rx="38" ry="18" fill="url(#sc)" />
          </g>
          {[40, 56, 72, 88].map((x, i) => (
            <text key={i} x={x} y="86" textAnchor="middle" fontSize="14" fill="#E2E8F0"
              style={{ animation: `wx-snow 2.2s ease-in-out infinite ${i * 0.3}s` }}>❄</text>
          ))}
        </svg>
      );
  }
}
