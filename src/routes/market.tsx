import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sparkles, TrendingUp, ArrowDownRight, ArrowUpRight, Minus,
  MapPin, Store, Calendar, Filter, X, Loader2, AlertCircle, Layers,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  fetchMarketPrices, COMMODITY_CATEGORIES,
  type MarketRecord, type MarketResponse,
} from "@/lib/market.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Prices — Agro Advisor AI" },
      { name: "description", content: "Live mandi prices from Indian markets for any crop. Search by commodity, state, district or mandi." },
    ],
  }),
  component: MarketPage,
});

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const POPULAR = ["Rice", "Cotton", "Tomato", "Chilli", "Groundnut", "Maize", "Wheat", "Banana", "Mango", "Onion", "Potato", "Turmeric", "Sugarcane", "Soyabean"];

const CROP_IMG: Record<string, string> = {
  Rice: "https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?w=600&q=70",
  Paddy: "https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?w=600&q=70",
  Cotton: "https://images.unsplash.com/photo-1594641223238-f3f5b06c8e21?w=600&q=70",
  Tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=70",
  Chilli: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=600&q=70",
  Groundnut: "https://images.unsplash.com/photo-1567892737950-30c4db748605?w=600&q=70",
  Maize: "https://images.unsplash.com/photo-1601593768797-9d92ade4f8cd?w=600&q=70",
  Wheat: "https://images.unsplash.com/photo-1574323347407-f5e1c5a1ec21?w=600&q=70",
  Banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=70",
  Mango: "https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=600&q=70",
  Onion: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&q=70",
  Potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=70",
  Turmeric: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=70",
  Sugarcane: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=70",
  Soyabean: "https://images.unsplash.com/photo-1612257999691-c9a7ea0c8e88?w=600&q=70",
  Soybean: "https://images.unsplash.com/photo-1612257999691-c9a7ea0c8e88?w=600&q=70",
};
function imgFor(name: string) {
  const k = Object.keys(CROP_IMG).find((c) => name.toLowerCase().includes(c.toLowerCase()));
  return CROP_IMG[k ?? "Rice"];
}

function categoryOf(commodity: string): string {
  for (const [cat, list] of Object.entries(COMMODITY_CATEGORIES)) {
    if (list.some((c) => c.toLowerCase() === commodity.toLowerCase())) return cat;
  }
  return "Other";
}

function MarketPage() {
  const callApi = useServerFn(fetchMarketPrices);
  const [query, setQuery] = useState("Tomato");
  const [submitted, setSubmitted] = useState("Tomato");
  const [state, setState] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [data, setData] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial + on-submit fetch
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await callApi({
          data: {
            commodity: submitted.trim() || undefined,
            state: state || undefined,
            district: district || undefined,
            market: market || undefined,
            limit: 120,
          },
        });
        if (!alive) return;
        setData(res);
        if (res.error) setError(res.error);
      } catch {
        if (alive) setError("Couldn't load market prices. Please retry.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [submitted, state, district, market, callApi]);

  // Debounced commit on typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSubmitted(query.trim()), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Derive filter options from the active result set
  const records = data?.records ?? [];
  const states   = useMemo(() => uniq(records.map((r) => r.state)),    [records]);
  const districts = useMemo(() => uniq(records.filter((r) => !state || r.state === state).map((r) => r.district)), [records, state]);
  const markets  = useMemo(() => uniq(records
    .filter((r) => (!state || r.state === state) && (!district || r.district === district))
    .map((r) => r.market)), [records, state, district]);

  const filtered = useMemo(() => {
    let out = records;
    if (category) out = out.filter((r) => categoryOf(r.commodity) === category);
    return out;
  }, [records, category]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const prices = filtered.map((r) => r.modalPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const high = Math.max(...prices);
    const low  = Math.min(...prices);
    return { avg, high, low, count: filtered.length };
  }, [filtered]);

  const activeFilters = [state, district, market, category].filter(Boolean).length;

  return (
    <div className="relative min-h-screen pb-24">
      <BackgroundOrbs />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:pt-12">
        <Header />

        {/* Search bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSubmitted(query.trim()); }}
              placeholder="Search any crop or product — rice, banana, turmeric…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            {query && (
              <button onClick={() => { setQuery(""); setSubmitted(""); }}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <button onClick={() => setShowFilters((v) => !v)}
            className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-xl transition",
              showFilters || activeFilters > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/40 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/5",
            )}>
            <Filter className="h-4 w-4" /> Filters
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{activeFilters}</span>
            )}
          </button>
        </div>

        {/* Popular chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR.map((c) => (
            <button key={c}
              onClick={() => { setQuery(c); setSubmitted(c); }}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
                submitted.toLowerCase() === c.toLowerCase()
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/40 bg-white/60 text-foreground/80 hover:bg-white dark:border-white/10 dark:bg-white/5",
              )}>
              {c}
            </button>
          ))}
        </div>

        {/* Filters drawer */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="mt-3 grid gap-3 rounded-2xl border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
                <SelectField label="State" value={state} onChange={(v) => { setState(v); setDistrict(""); setMarket(""); }} options={states} />
                <SelectField label="District" value={district} onChange={(v) => { setDistrict(v); setMarket(""); }} options={districts} disabled={!state} />
                <SelectField label="Market" value={market} onChange={setMarket} options={markets} disabled={!district} />
                <SelectField label="Category" value={category} onChange={setCategory} options={Object.keys(COMMODITY_CATEGORIES)} />
                {activeFilters > 0 && (
                  <button onClick={() => { setState(""); setDistrict(""); setMarket(""); setCategory(""); }}
                    className="col-span-full inline-flex items-center justify-center gap-1 self-end rounded-xl border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-medium hover:bg-white dark:border-white/10 dark:bg-white/5">
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <StatTile label="Results" value={String(stats.count)} icon={Layers} />
            <StatTile label="Average price" value={`₹${fmtINR(Math.round(stats.avg))}`} icon={TrendingUp} />
            <StatTile label="Highest" value={`₹${fmtINR(stats.high)}`} icon={ArrowUpRight} tone="text-emerald-600" />
            <StatTile label="Lowest" value={`₹${fmtINR(stats.low)}`} icon={ArrowDownRight} tone="text-rose-600" />
          </div>
        )}

        {/* Body */}
        <div className="mt-6">
          {loading && !data && <Skeleton />}
          {!loading && error && (
            <ErrorState message={error} onRetry={() => setSubmitted((s) => s + "")} />
          )}
          {!loading && !error && filtered.length === 0 && (
            <NoResults query={submitted} onPick={(c) => { setQuery(c); setSubmitted(c); }} />
          )}
          {filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r, i) => <PriceCard key={r.id} r={r} delay={i * 0.02} />)}
            </div>
          )}
        </div>

        <p className="mt-8 flex items-start gap-2 rounded-2xl border border-white/40 bg-white/60 p-3 text-[11px] leading-relaxed text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-white/5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          Live wholesale prices in ₹/quintal from Agmarknet via data.gov.in. Confirm at your local mandi before trading.
        </p>
      </div>
    </div>
  );
}

// ---------- pieces ----------
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-300/20 blur-3xl" />
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <TrendingUp className="h-3 w-3" /> Live mandi prices
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Market <span className="text-gradient-leaf">prices</span> today
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Search any crop and compare prices across Indian mandis. Powered by data.gov.in.
      </p>
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled }:
  { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <select disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className={cn("flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground", tone)}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl tracking-tight">{value}</div>
    </div>
  );
}

function PriceCard({ r, delay }: { r: MarketRecord; delay: number }) {
  const trend = r.modalPrice - (r.minPrice + r.maxPrice) / 2;
  const range = Math.max(1, r.maxPrice - r.minPrice);
  const pct = (trend / range) * 100;
  const positive = trend > 0;
  const neutral = Math.abs(trend) < 1;
  const series = [
    { v: r.minPrice }, { v: (r.minPrice + r.modalPrice) / 2 },
    { v: r.modalPrice }, { v: (r.modalPrice + r.maxPrice) / 2 }, { v: r.maxPrice },
  ];
  const cat = categoryOf(r.commodity);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[var(--shadow-soft)] backdrop-blur-xl transition hover:shadow-[var(--shadow-elegant)] dark:border-white/10 dark:bg-white/5">
      <div className="relative h-28 w-full overflow-hidden">
        <img src={imgFor(r.commodity)} alt={r.commodity} loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          {cat}
        </span>
        <ChangePill positive={positive} neutral={neutral} pct={pct} className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="line-clamp-1 font-display text-xl leading-tight">{r.commodity}</div>
          {r.variety && r.variety !== "Other" && (
            <div className="text-[11px] opacity-80">{r.variety}</div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Modal price</div>
            <div className="font-display text-3xl tracking-tight">₹{fmtINR(r.modalPrice)}</div>
            <div className="text-[11px] text-muted-foreground">per quintal</div>
          </div>
          <div className="h-14 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id={`g-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? "#10b981" : "#f43f5e"} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={positive ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v"
                  stroke={positive ? "#10b981" : "#f43f5e"} strokeWidth={2}
                  fill={`url(#g-${r.id})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <Mini label="Min" value={`₹${fmtINR(r.minPrice)}`} />
          <Mini label="Max" value={`₹${fmtINR(r.maxPrice)}`} />
        </div>

        <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><Store className="h-3 w-3" /> {r.market}, {r.district}</div>
          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {r.state}</div>
          <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Updated {r.arrivalDate}</div>
        </div>
      </div>
    </motion.div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  );
}

function ChangePill({ positive, neutral, pct, className }:
  { positive: boolean; neutral: boolean; pct: number; className?: string }) {
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow",
      neutral ? "bg-white/90 text-muted-foreground"
        : positive ? "bg-emerald-500/95 text-white"
        : "bg-rose-500/95 text-white",
      className,
    )}>
      <Icon className="h-3 w-3" />
      {positive && !neutral ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-3xl bg-white/40 dark:bg-white/5" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
      <AlertCircle className="h-10 w-10 text-rose-500" />
      <p className="mt-3 font-medium">{message}</p>
      <button onClick={onRetry}
        className="mt-4 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background">
        Retry
      </button>
    </div>
  );
}

function NoResults({ query, onPick }: { query: string; onPick: (c: string) => void }) {
  const suggestions = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return POPULAR.slice(0, 6);
    const scored = POPULAR.map((c) => ({
      c, score: similarity(c.toLowerCase(), q),
    })).sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((x) => x.c);
  }, [query]);

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/40 p-10 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="text-5xl">🌾</div>
      <h3 className="mt-3 font-display text-2xl">No market data found</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        We couldn't find live prices for <span className="font-medium text-foreground">"{query || "your search"}"</span>.
        Try one of these similar crops:
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => onPick(s)}
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- utils ----------
function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))].sort();
}

// Tiny similarity: bigram overlap. Good enough for "suggest similar crops".
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  const bigrams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
  };
  const A = bigrams(a), B = bigrams(b);
  let inter = 0;
  A.forEach((x) => { if (B.has(x)) inter++; });
  return (2 * inter) / (A.size + B.size || 1);
}
