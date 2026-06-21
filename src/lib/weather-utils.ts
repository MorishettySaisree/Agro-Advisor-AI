// Open-Meteo WMO weather code mapping
export type WeatherKind =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "thunderstorm"
  | "snow";

export function codeToKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 65) return "rain";
  if (code >= 66 && code <= 67) return "rain";
  if (code >= 80 && code <= 82) return "heavy-rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "thunderstorm";
  return "cloudy";
}

export function codeToLabel(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Heavy showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Thunderstorm w/ hail",
    99: "Severe thunderstorm",
  };
  return map[code] ?? "Unknown";
}

export function uvLabel(uv: number): { label: string; tone: string } {
  if (uv < 3) return { label: "Low", tone: "text-emerald-500" };
  if (uv < 6) return { label: "Moderate", tone: "text-amber-500" };
  if (uv < 8) return { label: "High", tone: "text-orange-500" };
  if (uv < 11) return { label: "Very High", tone: "text-red-500" };
  return { label: "Extreme", tone: "text-fuchsia-500" };
}

export function aqiLabel(aqi: number): { label: string; tone: string } {
  if (aqi <= 20) return { label: "Excellent", tone: "text-emerald-500" };
  if (aqi <= 40) return { label: "Good", tone: "text-lime-500" };
  if (aqi <= 60) return { label: "Moderate", tone: "text-amber-500" };
  if (aqi <= 80) return { label: "Poor", tone: "text-orange-500" };
  if (aqi <= 100) return { label: "Very Poor", tone: "text-red-500" };
  return { label: "Hazardous", tone: "text-fuchsia-500" };
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function shortDay(iso: string, i: number): string {
  if (i === 0) return "Today";
  if (i === 1) return "Tomorrow";
  return new Date(iso).toLocaleDateString([], { weekday: "short" });
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
