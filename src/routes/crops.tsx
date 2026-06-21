import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout, MapPin, Loader2, Sparkles, Droplets, Beaker, Calendar,
  TrendingUp, ShoppingCart, AlertTriangle, ChevronRight, Leaf, Wheat, BadgeCheck,
} from "lucide-react";
import {
  recommendCrop, SOIL_TYPES,
  type Recommendation, type CropRecommendation,
} from "@/lib/crops.functions";
import { SOIL_META } from "@/lib/crop-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crops")({
  head: () => ({
    meta: [
      { title: "AI Crop Recommendation — Agro Advisor AI" },
      { name: "description", content: "AI-powered crop recommendations using your location, soil and climate — with yield, profitability and market demand." },
    ],
  }),
  component: CropsPage,
});

type Soil = (typeof SOIL_TYPES)[number];
interface FormState {
  location: string;
  soil: Soil | "";
  ph?: number; nitrogen?: number; phosphorus?: number; potassium?: number;
  temperature?: number; rainfall?: number;
}

function CropsPage() {
  const [form, setForm] = useState<FormState>({ location: "", soil: "" });
  const [result, setResult] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const recommend = useServerFn(recommendCrop);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.location.trim() || !form.soil) {
      setError("Please enter location and soil type.");
      return;
    }
    setError(null); setLoading(true); setResult(null);
    try {
      const r = await recommend({
        data: {
          location: form.location.trim(),
          soil: form.soil,
          ph: form.ph, nitrogen: form.nitrogen, phosphorus: form.phosphorus,
          potassium: form.potassium, temperature: form.temperature, rainfall: form.rainfall,
        },
      });
      setResult(r);
    } catch {
      // Server fn has its own fallback, but just in case:
      setError("We had trouble reaching the AI. Showing default suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen pb-24">
      <BackgroundOrbs />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        <Header />
        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <FormPanel
            form={form} setForm={setForm}
            showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced}
            loading={loading} error={error} onSubmit={onSubmit}
          />
          <ResultPanel result={result} loading={loading} />
        </div>
      </div>
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-500/10" />
      <div className="absolute top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/10" />
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3 w-3" /> AI Crop Advisor
      </div>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Find the perfect crop for your field.</h1>
      <p className="max-w-2xl text-muted-foreground">
        Tell us your location and soil. Our AI agronomist suggests the best crop with yield, water need, fertilizer and market outlook.
      </p>
    </div>
  );
}

// ---------------- Form ----------------
function FormPanel({
  form, setForm, showAdvanced, setShowAdvanced, loading, error, onSubmit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  showAdvanced: boolean; setShowAdvanced: (v: boolean) => void;
  loading: boolean; error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const setNum = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm({ ...form, [k]: v === "" ? undefined : Number(v) });
  };

  return (
    <form onSubmit={onSubmit}
      className="h-fit rounded-3xl border border-white/40 bg-white/60 p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Leaf className="h-4 w-4 text-primary" /> Field details
      </div>

      <label className="mt-4 block text-xs font-medium text-muted-foreground">Location</label>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-input bg-background/60 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. Nashik, Maharashtra"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>

      <label className="mt-4 block text-xs font-medium text-muted-foreground">Soil type</label>
      <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SOIL_TYPES.map((s) => {
          const meta = SOIL_META[s];
          const active = form.soil === s;
          return (
            <button type="button" key={s} onClick={() => setForm({ ...form, soil: s })}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-3 text-left transition",
                active
                  ? "border-primary bg-primary/10 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                  : "border-white/40 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
              )}>
              <div className={cn("absolute -right-4 -top-4 h-14 w-14 rounded-full bg-gradient-to-br opacity-40 blur-xl", meta.tone)} />
              <div className="relative text-lg">{meta.emoji}</div>
              <div className="relative mt-1 text-xs font-medium">{s}</div>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-5 flex w-full items-center justify-between rounded-xl px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <span className="inline-flex items-center gap-1.5"><Beaker className="h-3.5 w-3.5" /> Soil & climate (optional)</span>
        <ChevronRight className={cn("h-4 w-4 transition", showAdvanced && "rotate-90")} />
      </button>

      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="grid grid-cols-2 gap-2 pt-3">
              <NumField label="pH" value={form.ph} onChange={setNum("ph")} placeholder="6.5" step="0.1" />
              <NumField label="Nitrogen (kg/ha)" value={form.nitrogen} onChange={setNum("nitrogen")} placeholder="80" />
              <NumField label="Phosphorus" value={form.phosphorus} onChange={setNum("phosphorus")} placeholder="40" />
              <NumField label="Potassium" value={form.potassium} onChange={setNum("potassium")} placeholder="40" />
              <NumField label="Temp (°C)" value={form.temperature} onChange={setNum("temperature")} placeholder="28" />
              <NumField label="Rainfall (mm/yr)" value={form.rainfall} onChange={setNum("rainfall")} placeholder="900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-glow px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-95 disabled:opacity-60">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your field…</>
          : <><Sparkles className="h-4 w-4" /> Recommend best crop</>}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">AI-generated. Verify with local agri-extension before sowing.</p>
    </form>
  );
}

function NumField({ label, value, onChange, placeholder, step }:
  { label: string; value?: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; step?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
      <input type="number" inputMode="decimal" step={step} value={value ?? ""} onChange={onChange} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}

// ---------------- Result ----------------
function ResultPanel({ result, loading }: { result: Recommendation | null; loading: boolean }) {
  if (loading && !result) return <SkeletonResult />;
  if (!result) return <EmptyState />;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PrimaryCard crop={result.primary} />
      {result.alternatives.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-2xl">Alternative crops</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.alternatives.map((c, i) => <AltCard key={i} crop={c} delay={i * 0.06} />)}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/30 p-8 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary-glow/20">
        <Sprout className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-2xl">Ready when you are</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Fill in your location and soil to get a tailored crop plan with yield, profitability and market demand.
      </p>
    </div>
  );
}

function SkeletonResult() {
  return (
    <div className="space-y-4">
      <div className="h-80 animate-pulse rounded-3xl bg-white/40 dark:bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/40 dark:bg-white/5" />)}
      </div>
    </div>
  );
}

// ---------------- Cards ----------------
function PrimaryCard({ crop }: { crop: CropRecommendation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-white/40 bg-white/60 backdrop-blur-2xl shadow-[0_10px_60px_-18px_rgba(16,185,129,0.45)] dark:border-white/10 dark:bg-white/5">
      <div className="relative h-56 w-full overflow-hidden sm:h-64">
        <CropImage src={crop.imageUrl} alt={crop.cropName} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow">
            <BadgeCheck className="h-3.5 w-3.5" /> AI top pick
          </span>
          <ConfidenceRing value={Math.round(crop.confidence)} />
        </div>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="text-[11px] uppercase tracking-wider opacity-80">Recommended crop</div>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">{crop.cropName}</h2>
          <p className="mt-1 max-w-xl text-sm opacity-90">{crop.description}</p>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        <Stat icon={Calendar}    label="Season"            value={crop.season}           tone="text-emerald-600" />
        <Stat icon={Droplets}    label="Water requirement" value={crop.waterRequirement} tone="text-sky-600" />
        <Stat icon={Sprout}      label="Soil suitability"  value={crop.soilSuitability}  tone="text-lime-600" />
        <Stat icon={Wheat}       label="Expected yield"    value={crop.expectedYield}    tone="text-amber-600" />
        <Stat icon={Beaker}      label="Fertilizer"        value={crop.fertilizer}       tone="text-violet-600" />
        <Stat icon={ShoppingCart} label="Market demand"    value={crop.marketDemand}     tone="text-rose-600" />
        <Stat icon={TrendingUp}  label="Profitability"     value={crop.profitability}    tone="text-teal-600" className="sm:col-span-3" />
      </div>
    </motion.div>
  );
}

function AltCard({ crop, delay }: { crop: CropRecommendation; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="relative h-32 w-full overflow-hidden">
        <CropImage src={crop.imageUrl} alt={crop.cropName} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <h4 className="font-display text-xl">{crop.cropName}</h4>
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {Math.round(crop.confidence)}%
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-xs text-muted-foreground">{crop.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <Mini label="Season"     value={crop.season} />
          <Mini label="Water"      value={crop.waterRequirement} />
          <Mini label="Yield"      value={crop.expectedYield} />
          <Mini label="Profit"     value={crop.profitability} />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div initial={{ width: 0 }} animate={{ width: `${crop.confidence}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-primary-glow" />
        </div>
      </div>
    </motion.div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate text-xs font-medium">{value}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, className }:
  { icon: any; label: string; value: string; tone: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/40 bg-white/60 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5", className)}>
      <div className={cn("flex items-center gap-1.5 text-[11px] uppercase tracking-wider", tone)}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold leading-tight">{value}</div>
    </div>
  );
}

function CropImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-200 to-lime-300 text-6xl">
        🌾
      </div>
    );
  }
  return (
    <img src={src} alt={alt} loading="lazy"
      onError={() => setErrored(true)}
      className="h-full w-full object-cover" />
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="6" fill="none" className="text-emerald-100" />
        <motion.circle
          cx="40" cy="40" r={r} stroke="url(#cgrad)" strokeWidth="6" strokeLinecap="round" fill="none"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }} />
        <defs>
          <linearGradient id="cgrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#84CC16" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-base font-bold text-emerald-700">{value}%</div>
        <div className="text-[8px] uppercase tracking-wider text-emerald-600/80">Match</div>
      </div>
    </div>
  );
}
