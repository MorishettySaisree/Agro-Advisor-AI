import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Loader2, Droplets, Wind, Sun, Eye, Sunrise, Sunset,
  Thermometer, CloudRain, Gauge, AlertTriangle, Flame, Waves, Compass, LocateFixed,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { AnimatedWeatherIcon } from "@/components/weather/animated-icon";
import {
  codeToKind, codeToLabel, uvLabel, aqiLabel, formatTime, shortDay, fullDate,
  type WeatherKind,
} from "@/lib/weather-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather Forecast — Agro Advisor AI" },
      { name: "description", content: "Hyper-local 10-day weather, air quality, rain & heat alerts for farmers." },
    ],
  }),
  component: WeatherPage,
});

// ---------- types ----------
interface Place { name: string; admin1?: string; admin2?: string; country?: string; latitude: number; longitude: number; }
interface Forecast {
  current: {
    temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number;
    wind_speed_10m: number; wind_direction_10m: number; precipitation: number;
    weather_code: number; surface_pressure: number; uv_index: number; is_day: number;
  };
  hourly: {
    time: string[]; temperature_2m: number[]; precipitation_probability: number[];
    relative_humidity_2m: number[]; weather_code: number[];
  };
  daily: {
    time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[];
    precipitation_probability_max: number[]; precipitation_sum: number[];
    weather_code: number[]; sunrise: string[]; sunset: string[];
    uv_index_max: number[]; wind_speed_10m_max: number[];
    relative_humidity_2m_mean?: number[];
  };
}

// ---------- API ----------
async function geocode(q: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const r = await fetch(url);
  const j = await r.json();
  return (j.results ?? []).map((p: any) => ({
    name: p.name, admin1: p.admin1, admin2: p.admin2, country: p.country,
    latitude: p.latitude, longitude: p.longitude,
  }));
}

async function reverseGeocode(lat: number, lon: number): Promise<Place | null> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
    const j = await r.json();
    const p = j.results?.[0];
    if (!p) return { name: "Current location", latitude: lat, longitude: lon };
    return { name: p.name, admin1: p.admin1, admin2: p.admin2, country: p.country, latitude: lat, longitude: lon };
  } catch {
    return { name: "Current location", latitude: lat, longitude: lon };
  }
}

async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,surface_pressure,uv_index,is_day",
    hourly: "temperature_2m,precipitation_probability,relative_humidity_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code,sunrise,sunset,uv_index_max,wind_speed_10m_max",
    timezone: "auto", forecast_days: "10",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!r.ok) throw new Error("Forecast failed");
  return r.json();
}

async function fetchAirQuality(lat: number, lon: number): Promise<{ aqi: number; pm25: number; pm10: number } | null> {
  try {
    const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5`);
    if (!r.ok) return null;
    const j = await r.json();
    return { aqi: j.current?.european_aqi ?? 0, pm10: j.current?.pm10 ?? 0, pm25: j.current?.pm2_5 ?? 0 };
  } catch { return null; }
}

// ---------- helpers ----------
function placeLabel(p: Place) {
  return [p.name, p.admin1, p.country].filter(Boolean).join(", ");
}
function compass(deg: number) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// ---------- page ----------
function WeatherPage() {
  const [place, setPlace] = useState<Place | null>(null);
  const [data, setData] = useState<Forecast | null>(null);
  const [air, setAir] = useState<{ aqi: number; pm25: number; pm10: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // initial: try geolocation, fallback to Delhi
  useEffect(() => {
    if (!navigator.geolocation) {
      pickPlace({ name: "New Delhi", country: "India", latitude: 28.6139, longitude: 77.209 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (p) pickPlace(p);
      },
      () => pickPlace({ name: "New Delhi", country: "India", latitude: 28.6139, longitude: 77.209 }),
      { timeout: 6000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickPlace(p: Place) {
    setPlace(p); setLoading(true); setError(null);
    try {
      const [f, a] = await Promise.all([fetchForecast(p.latitude, p.longitude), fetchAirQuality(p.latitude, p.longitude)]);
      setData(f); setAir(a);
    } catch (e: any) { setError(e.message ?? "Failed to load weather"); }
    finally { setLoading(false); }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (p) pickPlace(p);
      },
      () => { setLoading(false); setError("Location permission denied"); },
    );
  }

  const kind: WeatherKind = data ? codeToKind(data.current.weather_code) : "clear";
  const bg = useMemo(() => kindBg(kind, data?.current.is_day ?? 1), [kind, data?.current.is_day]);

  return (
    <div className="relative min-h-screen pb-24">
      <BackgroundScene bg={bg} />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        <Header place={place} onPick={pickPlace} onLocate={useMyLocation} />

        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="mt-24 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p>Loading weather…</p>
          </div>
        ) : data && place ? (
          <>
            <Alerts data={data} />
            <Hero place={place} data={data} kind={kind} />
            <Stats data={data} air={air} />
            <Charts data={data} />
            <DailyForecast data={data} />
            <MapCard place={place} />
          </>
        ) : null}
      </div>
    </div>
  );
}

// ---------- background ----------
function kindBg(kind: WeatherKind, isDay: number) {
  if (!isDay) return "from-[#0b1220] via-[#13203b] to-[#0b1220]";
  switch (kind) {
    case "clear": return "from-[#FEF3C7] via-[#FDE68A] to-[#FCA5A5]";
    case "partly-cloudy": return "from-[#DBEAFE] via-[#BFDBFE] to-[#FED7AA]";
    case "cloudy":
    case "fog": return "from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]";
    case "drizzle":
    case "rain":
    case "heavy-rain": return "from-[#1E3A8A] via-[#1E40AF] to-[#0EA5E9]";
    case "thunderstorm": return "from-[#1F2937] via-[#312E81] to-[#0F172A]";
    case "snow": return "from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1]";
  }
}

function BackgroundScene({ bg }: { bg: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 dark:opacity-30 transition-colors duration-1000", bg)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.4),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.25),transparent_45%)] dark:opacity-20" />
    </div>
  );
}

// ---------- header / search ----------
function Header({ place, onPick, onLocate }: { place: Place | null; onPick: (p: Place) => void; onLocate: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setResults(await geocode(q)); setOpen(true); }
      finally { setSearching(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Weather</h1>
        {place && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {placeLabel(place)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div ref={boxRef} className="relative w-full sm:w-80">
          <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/40 px-3.5 py-2.5 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-white/5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)}
              placeholder="Village, city, district, state…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/30 bg-white/80 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/80"
              >
                {results.map((r, i) => (
                  <li key={i}>
                    <button onClick={() => { onPick(r); setOpen(false); setQ(""); }}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-primary/10">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span><span className="font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">{[r.admin2, r.admin1, r.country].filter(Boolean).join(", ")}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <button onClick={onLocate} title="Use my location"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- alerts ----------
function Alerts({ data }: { data: Forecast }) {
  const alerts: { icon: any; title: string; body: string; tone: string }[] = [];
  const maxTempNext3 = Math.max(...data.daily.temperature_2m_max.slice(0, 3));
  const rainNext3 = Math.max(...data.daily.precipitation_probability_max.slice(0, 3));
  const rainSum3 = data.daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0);

  if (maxTempNext3 >= 40) alerts.push({
    icon: Flame, title: "Heatwave warning",
    body: `Temperatures up to ${Math.round(maxTempNext3)}°C in the next 3 days. Irrigate early morning and shade young plants.`,
    tone: "from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300",
  });
  if (rainNext3 >= 70) alerts.push({
    icon: CloudRain, title: "Heavy rain alert",
    body: `${rainNext3}% chance of rain in coming days. Delay spraying and protect harvested produce.`,
    tone: "from-sky-500/20 to-blue-500/20 border-sky-500/40 text-sky-700 dark:text-sky-300",
  });
  if (rainSum3 >= 80) alerts.push({
    icon: Waves, title: "Flood risk",
    body: `${Math.round(rainSum3)}mm rainfall expected. Check drainage channels and field bunds.`,
    tone: "from-indigo-500/20 to-violet-500/20 border-indigo-500/40 text-indigo-700 dark:text-indigo-300",
  });

  if (!alerts.length) return null;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {alerts.map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className={cn("rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-xl", a.tone)}>
          <div className="flex items-center gap-2 font-medium">
            <a.icon className="h-4 w-4" /> {a.title}
          </div>
          <p className="mt-1.5 text-sm opacity-90">{a.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ---------- hero ----------
function Hero({ place, data, kind }: { place: Place; data: Forecast; kind: WeatherKind }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="mt-6 overflow-hidden rounded-3xl border border-white/30 bg-white/40 p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10"
    >
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-4 sm:gap-6">
          <AnimatedWeatherIcon kind={kind} size={120} />
          <div>
            <div className="text-7xl font-light leading-none tracking-tight sm:text-8xl">
              {Math.round(data.current.temperature_2m)}°
            </div>
            <div className="mt-2 text-lg font-medium">{codeToLabel(data.current.weather_code)}</div>
            <div className="text-sm text-muted-foreground">Feels like {Math.round(data.current.apparent_temperature)}° · {place.name}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
          <MiniStat label="High" value={`${Math.round(data.daily.temperature_2m_max[0])}°`} />
          <MiniStat label="Low" value={`${Math.round(data.daily.temperature_2m_min[0])}°`} />
          <MiniStat label="Rain" value={`${data.daily.precipitation_probability_max[0] ?? 0}%`} />
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div><div className="text-2xl font-semibold sm:text-3xl">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div></div>
  );
}

// ---------- stats grid ----------
function Stats({ data, air }: { data: Forecast; air: { aqi: number; pm25: number; pm10: number } | null }) {
  const c = data.current;
  const uv = uvLabel(c.uv_index ?? 0);
  const aq = air ? aqiLabel(air.aqi) : null;
  const items = [
    { icon: Thermometer, label: "Feels like", value: `${Math.round(c.apparent_temperature)}°` },
    { icon: Droplets, label: "Humidity", value: `${c.relative_humidity_2m}%` },
    { icon: Wind, label: "Wind", value: `${Math.round(c.wind_speed_10m)} km/h`, sub: compass(c.wind_direction_10m) },
    { icon: CloudRain, label: "Rain today", value: `${data.daily.precipitation_probability_max[0] ?? 0}%`, sub: `${data.daily.precipitation_sum[0]?.toFixed(1) ?? 0} mm` },
    { icon: Sun, label: "UV index", value: `${Math.round(c.uv_index ?? 0)}`, sub: uv.label, tone: uv.tone },
    { icon: Eye, label: "Air quality", value: air ? `${Math.round(air.aqi)}` : "—", sub: aq?.label ?? "—", tone: aq?.tone },
    { icon: Sunrise, label: "Sunrise", value: formatTime(data.daily.sunrise[0]) },
    { icon: Sunset, label: "Sunset", value: formatTime(data.daily.sunset[0]) },
    { icon: Gauge, label: "Pressure", value: `${Math.round(c.surface_pressure)} hPa` },
    { icon: Compass, label: "Wind dir", value: compass(c.wind_direction_10m), sub: `${Math.round(c.wind_direction_10m)}°` },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {items.map((it, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
          className="rounded-2xl border border-white/30 bg-white/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <it.icon className="h-3.5 w-3.5" /> {it.label}
          </div>
          <div className="mt-2 text-2xl font-semibold">{it.value}</div>
          {it.sub && <div className={cn("text-xs", it.tone ?? "text-muted-foreground")}>{it.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}

// ---------- charts ----------
function Charts({ data }: { data: Forecast }) {
  const hourly = data.hourly.time.slice(0, 24).map((t, i) => ({
    time: new Date(t).toLocaleTimeString([], { hour: "numeric" }),
    temp: Math.round(data.hourly.temperature_2m[i]),
    rain: data.hourly.precipitation_probability[i] ?? 0,
    humidity: data.hourly.relative_humidity_2m[i] ?? 0,
  }));

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <ChartCard title="24-hour temperature">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={11} interval={3} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} unit="°" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="temp" stroke="#10B981" strokeWidth={2.5} fill="url(#tg)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Rain probability & humidity">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={11} interval={3} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} unit="%" />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="rain" stroke="#38BDF8" strokeWidth={2.5} dot={false} name="Rain" />
            <Line type="monotone" dataKey="humidity" stroke="#A78BFA" strokeWidth={2.5} dot={false} name="Humidity" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 12, fontSize: 12, backdropFilter: "blur(12px)",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}

// ---------- daily forecast ----------
function DailyForecast({ data }: { data: Forecast }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-2xl">10-day forecast</h2>
        <span className="text-xs text-muted-foreground">Tap a day for details</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {data.daily.time.map((t, i) => {
          const k = codeToKind(data.daily.weather_code[i]);
          return (
            <motion.div key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group rounded-2xl border border-white/30 bg-white/40 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{shortDay(t, i)}</div>
                  <div className="text-xs text-muted-foreground">{fullDate(t)}</div>
                </div>
                <AnimatedWeatherIcon kind={k} size={48} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                <span className="text-sm text-muted-foreground">{Math.round(data.daily.temperature_2m_min[i])}°</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CloudRain className="h-3 w-3 text-sky-500" />{data.daily.precipitation_probability_max[i] ?? 0}%</span>
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-violet-500" />{data.daily.precipitation_sum[i]?.toFixed(1) ?? 0}mm</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                  style={{ width: `${data.daily.precipitation_probability_max[i] ?? 0}%` }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- map ----------
function MapCard({ place }: { place: Place }) {
  const { latitude: lat, longitude: lon } = place;
  const d = 0.6;
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  return (
    <div className="mt-6">
      <h2 className="font-display text-2xl mb-3">Location & conditions</h2>
      <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <iframe title="Map" src={src} loading="lazy" className="h-[360px] w-full" />
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {placeLabel(place)}</span>
          <a className="hover:text-foreground" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`} target="_blank" rel="noreferrer">Open larger map</a>
        </div>
      </div>
    </div>
  );
}
