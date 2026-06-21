import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Camera, X, Sparkles, Loader2, AlertTriangle, ShieldCheck, Leaf, FlaskConical,
  Beaker, HeartPulse, BugOff, Sprout, Clock, Radio, ImageIcon, RefreshCw,
} from "lucide-react";
import { diagnoseDisease, DISEASE_CROPS, type Diagnosis } from "@/lib/disease.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/disease")({
  head: () => ({
    meta: [
      { title: "AI Disease Detection — Agro Advisor AI" },
      { name: "description", content: "Snap a leaf, get an instant AI diagnosis with organic + chemical cures, prevention and recovery plan." },
    ],
  }),
  component: DiseasePage,
});

const MAX_BYTES = 6 * 1024 * 1024; // 6MB

function DiseasePage() {
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [crop, setCrop] = useState<(typeof DISEASE_CROPS)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const run = useServerFn(diagnoseDisease);

  async function onPick(f: File | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please choose an image."); return; }
    if (f.size > MAX_BYTES) { setError("Image too large. Max 6MB."); return; }
    const dataUrl = await fileToDataUrl(f);
    setFile({ name: f.name, dataUrl });
    setDiag(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void onPick(f);
  }

  async function analyse() {
    if (!file) return;
    setLoading(true); setError(null); setDiag(null);
    try {
      const out = await run({
        data: {
          imageDataUrl: file.dataUrl,
          crop: crop || undefined,
          notes: notes.trim() || undefined,
        },
      });
      setDiag(out as Diagnosis);
    } catch (e: any) {
      setError(e?.message ?? "Could not analyse the image. Please try again.");
    } finally { setLoading(false); }
  }

  function reset() {
    setFile(null); setDiag(null); setError(null); setNotes("");
  }

  return (
    <div className="relative min-h-screen pb-24">
      <BackgroundOrbs />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        <Header />
        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-4">
            <Uploader
              file={file} onDrop={onDrop} onClickPick={() => fileRef.current?.click()}
              onClickCam={() => camRef.current?.click()} onClear={reset}
            />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPick(e.target.files?.[0] ?? null)} />

            <div className="rounded-3xl border border-white/40 bg-white/60 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
              <label className="text-xs font-medium text-muted-foreground">Crop (optional)</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DISEASE_CROPS.map((c) => (
                  <button key={c} type="button" onClick={() => setCrop(crop === c ? "" : c)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      crop === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/40 bg-white/50 hover:bg-white/70 dark:border-white/10 dark:bg-white/5",
                    )}>{c}</button>
                ))}
              </div>

              <label className="mt-4 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                placeholder="e.g. yellow spots appeared after the recent rain"
                rows={3}
                className="mt-1.5 w-full resize-none rounded-2xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}

              <button type="button" onClick={analyse} disabled={!file || loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-glow px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-95 disabled:opacity-50">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Diagnosing…</>
                  : <><Sparkles className="h-4 w-4" /> Diagnose now</>}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">AI-generated. Confirm cures with your local agri-extension officer.</p>
            </div>
          </div>

          <ResultPane file={file} diag={diag} loading={loading} onReset={reset} />
        </div>
      </div>
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-rose-300/25 blur-3xl dark:bg-rose-500/10" />
      <div className="absolute top-1/3 -left-24 h-[26rem] w-[26rem] rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/10" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/10" />
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-2 self-start rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-300">
        <BugOff className="h-3 w-3" /> AI Disease Detection
      </div>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Photograph a leaf. Get a diagnosis.</h1>
      <p className="max-w-2xl text-muted-foreground">
        Snap a clear photo of the affected leaf or fruit. Our vision AI identifies the disease, severity and recovery plan with organic and chemical cures.
      </p>
    </div>
  );
}

// ---------------- Uploader ----------------
function Uploader({ file, onDrop, onClickPick, onClickCam, onClear }: {
  file: { name: string; dataUrl: string } | null;
  onDrop: (e: React.DragEvent) => void;
  onClickPick: () => void; onClickCam: () => void; onClear: () => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"
    >
      {file ? (
        <div className="relative">
          <img src={file.dataUrl} alt={file.name}
            className="aspect-square w-full rounded-2xl object-cover shadow-lg" />
          <button onClick={onClear}
            className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80">
            <X className="h-4 w-4" />
          </button>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate"><ImageIcon className="mr-1 inline h-3.5 w-3.5" />{file.name}</span>
            <button onClick={onClickPick} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <RefreshCw className="h-3 w-3" /> Replace
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary-glow/5 px-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="mt-3 font-display text-xl">Upload a leaf photo</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">PNG, JPG or HEIC up to 6MB. Drag &amp; drop or use one of the options below.</p>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <button onClick={onClickPick}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/40 bg-white/60 px-3 py-2 text-sm font-medium hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <Upload className="h-4 w-4" /> Choose file
            </button>
            <button onClick={onClickCam}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
              <Camera className="h-4 w-4" /> Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Result ----------------
function ResultPane({ file, diag, loading, onReset }: {
  file: { name: string; dataUrl: string } | null;
  diag: Diagnosis | null; loading: boolean; onReset: () => void;
}) {
  if (loading) return <Skeleton file={file} />;
  if (!diag) return <Empty />;
  if (!diag.isPlant) return <NotPlant summary={diag.summary} onReset={onReset} />;
  return <Result file={file} d={diag} />;
}

function Empty() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/30 p-8 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400/20 to-amber-400/20">
        <Leaf className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="mt-4 font-display text-2xl">Awaiting your photo</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Get clear close-ups of the affected leaf, fruit or stem in natural daylight for the best diagnosis.
      </p>
    </div>
  );
}

function Skeleton({ file }: { file: { dataUrl: string } | null }) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-4">
          {file ? <img src={file.dataUrl} className="h-24 w-24 rounded-2xl object-cover" alt="" />
            : <div className="h-24 w-24 animate-pulse rounded-2xl bg-muted" />}
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Examining leaf texture, color and lesions…
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/40 dark:bg-white/5" />)}
      </div>
    </div>
  );
}

function NotPlant({ summary, onReset }: { summary: string; onReset: () => void }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border border-amber-400/40 bg-amber-50/60 p-8 text-center backdrop-blur-xl dark:bg-amber-500/5">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <h3 className="mt-3 font-display text-2xl">That doesn't look like a plant</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{summary}</p>
      <button onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
        <RefreshCw className="h-4 w-4" /> Try another photo
      </button>
    </div>
  );
}

function Result({ file, d }: { file: { dataUrl: string } | null; d: Diagnosis }) {
  const sev = severityTone(d.severity);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero diagnosis card */}
      <div className={cn("relative overflow-hidden rounded-3xl border bg-white/60 p-5 backdrop-blur-2xl dark:bg-white/5 sm:p-6", sev.border)}>
        <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br opacity-30", sev.bg)} />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
          {file && (
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={file.dataUrl} alt={d.disease}
              className="h-40 w-full rounded-2xl object-cover shadow-lg sm:h-44 sm:w-44 sm:shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {d.healthy ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> Healthy
                </span>
              ) : (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", sev.chip)}>
                  <BugOff className="h-3 w-3" /> {d.severity} severity
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium">
                <Leaf className="h-3 w-3" /> {d.crop}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium">
                <Radio className="h-3 w-3" /> Spread: {d.spreadRisk}
              </span>
            </div>
            <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{d.disease}</h2>
            {d.scientificName && (
              <p className="text-xs italic text-muted-foreground">{d.scientificName}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">{d.summary}</p>

            <div className="mt-4 flex flex-wrap items-end gap-6">
              <ConfidenceRing value={Math.round(d.confidence)} />
              <SeverityMeter score={Math.round(d.severityScore)} severity={d.severity} />
              <div className="min-w-[120px]">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Recovery in</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-lg font-semibold">
                  <Clock className="h-4 w-4 text-primary" /> {d.recoveryDays}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Symptom / Cause panels */}
      <div className="grid gap-3 md:grid-cols-2">
        <ListCard icon={AlertTriangle} title="Symptoms" tone="text-rose-500" items={d.symptoms} />
        <ListCard icon={FlaskConical} title="Causes" tone="text-amber-500" items={d.causes} />
      </div>

      {/* Cures */}
      <div className="grid gap-3 md:grid-cols-2">
        <ListCard icon={Leaf} title="Organic cure" tone="text-emerald-500"
          items={d.organicCure} accent="from-emerald-500/15 to-emerald-500/5" />
        <ListCard icon={Beaker} title="Chemical cure" tone="text-violet-500"
          items={d.chemicalCure} accent="from-violet-500/15 to-violet-500/5" />
      </div>

      {/* Prevention + fertilizer + recovery */}
      <div className="grid gap-3 md:grid-cols-3">
        <ListCard icon={ShieldCheck} title="Prevention" tone="text-sky-500" items={d.prevention} />
        <ListCard icon={Sprout} title="Fertilizer plan" tone="text-lime-600" items={d.fertilizer} />
        <ListCard icon={HeartPulse} title="Recovery tips" tone="text-rose-500" items={d.recoveryTips} />
      </div>
    </motion.div>
  );
}

function severityTone(sev: Diagnosis["severity"]) {
  switch (sev) {
    case "None":     return { bg: "from-emerald-300 to-emerald-500", border: "border-emerald-500/40", chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300", bar: "from-emerald-400 to-emerald-600" };
    case "Mild":     return { bg: "from-lime-300 to-yellow-400",     border: "border-lime-500/40",    chip: "bg-lime-500/15 text-lime-700 dark:text-lime-300",          bar: "from-lime-400 to-yellow-500" };
    case "Moderate": return { bg: "from-amber-300 to-orange-500",    border: "border-amber-500/40",   chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",       bar: "from-amber-400 to-orange-500" };
    case "Severe":   return { bg: "from-orange-400 to-red-500",      border: "border-orange-500/40",  chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",    bar: "from-orange-500 to-red-500" };
    case "Critical": return { bg: "from-red-500 to-rose-700",        border: "border-red-500/50",     chip: "bg-red-500/15 text-red-700 dark:text-red-300",             bar: "from-red-500 to-rose-700" };
  }
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} stroke="currentColor" strokeWidth="7" fill="none" className="text-muted/40" />
        <motion.circle cx="48" cy="48" r={r} stroke="url(#diaggrad)" strokeWidth="7" strokeLinecap="round" fill="none"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }} />
        <defs>
          <linearGradient id="diaggrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-semibold">{value}%</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
      </div>
    </div>
  );
}

function SeverityMeter({ score, severity }: { score: number; severity: Diagnosis["severity"] }) {
  const tone = severityTone(severity);
  return (
    <div className="min-w-[180px] flex-1">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>Severity</span><span>{score}/100</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full bg-gradient-to-r", tone.bar)} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>None</span><span>Mild</span><span>Moderate</span><span>Severe</span><span>Critical</span>
      </div>
    </div>
  );
}

function ListCard({ icon: Icon, title, items, tone, accent }: {
  icon: any; title: string; items: string[]; tone: string; accent?: string;
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5",
      accent && "bg-gradient-to-br",
      accent,
    )}>
      <div className={cn("flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider", tone)}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="flex gap-2 leading-snug">
            <span className={cn("mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full", tone.replace("text-", "bg-"))} />
            <span>{s}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- utils ----------------
function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}
