// Deterministic market price synthesizer.
// Generates indicative daily prices (INR per quintal) for supported crops.
// Same date + crop always yields the same value, so client/server agree.

export type MarketCrop = {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  base: number; // INR/quintal baseline
  volatility: number; // 0..1
  gradient: string;
};

export const MARKET_CROPS: MarketCrop[] = [
  { id: "rice", name: "Rice", emoji: "🍚", unit: "₹/quintal", base: 2200, volatility: 0.04, gradient: "from-emerald-500/80 to-emerald-700/80" },
  { id: "cotton", name: "Cotton", emoji: "🌱", unit: "₹/quintal", base: 7400, volatility: 0.06, gradient: "from-sky-500/80 to-indigo-600/80" },
  { id: "tomato", name: "Tomato", emoji: "🍅", unit: "₹/quintal", base: 1800, volatility: 0.18, gradient: "from-rose-500/80 to-red-600/80" },
  { id: "chilli", name: "Chilli", emoji: "🌶️", unit: "₹/quintal", base: 16500, volatility: 0.09, gradient: "from-orange-500/80 to-rose-600/80" },
  { id: "maize", name: "Maize", emoji: "🌽", unit: "₹/quintal", base: 2100, volatility: 0.05, gradient: "from-amber-500/80 to-yellow-600/80" },
  { id: "groundnut", name: "Groundnut", emoji: "🥜", unit: "₹/quintal", base: 6200, volatility: 0.05, gradient: "from-yellow-600/80 to-amber-700/80" },
];

// Mulberry32 PRNG → stable values per seed.
function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export type PricePoint = { date: string; label: string; price: number };

export function generateSeries(crop: MarketCrop, days = 30, end = new Date()): PricePoint[] {
  const out: PricePoint[] = [];
  const today = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  // Random walk anchored to base.
  let value = crop.base * (1 + (rand(hashStr(crop.id))() - 0.5) * crop.volatility);
  // Run forward from -days+1 to today using one PRNG per crop+day pair so it's deterministic.
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const seed = hashStr(`${crop.id}|${dayKey(d)}`);
    const r = rand(seed)();
    // Mean reverting random walk
    const drift = (crop.base - value) * 0.08;
    const noise = (r - 0.5) * 2 * crop.volatility * crop.base;
    value = Math.max(crop.base * 0.55, value + drift + noise);
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      price: Math.round(value),
    });
  }
  return out;
}

export type CropSnapshot = {
  crop: MarketCrop;
  today: number;
  yesterday: number;
  change: number;
  changePct: number;
  series: PricePoint[];
  weekHigh: number;
  weekLow: number;
};

export function buildSnapshots(now = new Date()): CropSnapshot[] {
  return MARKET_CROPS.map((crop) => {
    const series = generateSeries(crop, 30, now);
    const today = series[series.length - 1].price;
    const yesterday = series[series.length - 2].price;
    const week = series.slice(-7).map((p) => p.price);
    return {
      crop,
      today,
      yesterday,
      change: today - yesterday,
      changePct: ((today - yesterday) / yesterday) * 100,
      series,
      weekHigh: Math.max(...week),
      weekLow: Math.min(...week),
    };
  });
}
