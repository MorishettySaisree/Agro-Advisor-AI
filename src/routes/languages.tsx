import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Volume2, Loader2, Globe, Sprout, CloudSun, Bug, Bot } from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES, TRANSLATIONS, getStoredLang, setStoredLang, type LangCode } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/languages")({
  head: () => ({
    meta: [
      { title: "Languages — Agro Advisor" },
      { name: "description", content: "Switch the app between English, Hindi, Telugu, Tamil, Kannada and Marathi. Preview and hear each language." },
    ],
  }),
  component: LanguagesPage,
});

function LanguagesPage() {
  const [selected, setSelected] = useState<LangCode>("en");
  const [previewing, setPreviewing] = useState<LangCode | null>(null);

  useEffect(() => { setSelected(getStoredLang()); }, []);

  const choose = (code: LangCode) => {
    setSelected(code);
    setStoredLang(code);
    const meta = LANGUAGES.find((l) => l.code === code)!;
    toast.success(`${meta.native} selected`);
  };

  const speak = async (code: LangCode) => {
    setPreviewing(code);
    try {
      const text = TRANSLATIONS[code].tagline;
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setPreviewing(null); };
      audio.onerror = () => { URL.revokeObjectURL(url); setPreviewing(null); };
      await audio.play();
    } catch {
      toast.error("Couldn't play preview.");
      setPreviewing(null);
    }
  };

  const t = TRANSLATIONS[selected];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
          <Globe className="h-3 w-3 text-primary" /> 6 languages supported
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Choose your language</h1>
        <p className="mt-3 text-sm text-muted-foreground">Tap a card to switch instantly. Tap the speaker to hear it.</p>
      </div>

      {/* Language cards */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANGUAGES.map((l, i) => {
          const active = selected === l.code;
          return (
            <motion.button
              key={l.code}
              type="button"
              onClick={() => choose(l.code)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition ${
                active
                  ? "border-primary/60 bg-gradient-to-br from-primary/10 to-primary-glow/5 shadow-[var(--shadow-elegant)]"
                  : "border-border/60 bg-card hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="text-4xl">{l.flag}</div>
                {active && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="mt-4 font-display text-3xl tracking-tight">{l.native}</p>
              <p className="text-sm text-muted-foreground">{l.label} · {l.region}</p>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); void speak(l.code); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); void speak(l.code); } }}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                {previewing === l.code ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
                Hear sample
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="mt-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{t.preview}</p>
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card to-secondary/30 p-6 sm:p-10"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t.selected}: {LANGUAGES.find((l) => l.code === selected)?.native}</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">{t.greeting}</h2>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">{t.tagline}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PreviewTile icon={CloudSun} label={t.weather} />
            <PreviewTile icon={Sprout} label={t.crops} />
            <PreviewTile icon={Bug} label={t.disease} />
            <PreviewTile icon={Bot} label={t.ask} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => speak(selected)}
              variant="outline"
              className="rounded-full"
              disabled={previewing === selected}
            >
              {previewing === selected ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
              Speak preview
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PreviewTile({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-border/50 bg-background/70 p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
