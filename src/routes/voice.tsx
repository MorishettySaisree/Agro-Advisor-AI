import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic, MicOff, Square, Volume2, VolumeX, Languages, Sparkles,
  Loader2, AlertTriangle, RotateCcw, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { voiceReply, VOICE_LANGUAGES, type VoiceLang, type VoiceReply } from "@/lib/voice.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice Assistant — Agro Advisor" },
      { name: "description", content: "Hands-free farming voice assistant in 6 Indian languages." },
    ],
  }),
  component: VoicePage,
});

type Status = "idle" | "listening" | "thinking" | "speaking" | "error";
type Turn = { id: string; role: "user" | "assistant"; text: string };

const BCP47: Record<VoiceLang, string> = {
  en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN", mr: "mr-IN",
};

const STARTERS: Record<VoiceLang, string[]> = {
  en: ["What crop suits black soil?", "Weather tomorrow?", "Cure for rice blast?", "Best fertilizer for cotton?", "Govt schemes for small farmers?"],
  hi: ["काली मिट्टी के लिए कौन सी फसल?", "कल का मौसम?", "धान का ब्लास्ट कैसे ठीक करें?", "कपास के लिए खाद?", "किसानों के लिए सरकारी योजनाएँ?"],
  te: ["నల్ల నేలకి ఏ పంట?", "రేపు వాతావరణం?", "వరి బ్లాస్ట్ నివారణ?", "పత్తికి ఏ ఎరువు?", "రైతుల పథకాలు?"],
  ta: ["கருப்பு மண்ணுக்கு பயிர்?", "நாளை வானிலை?", "நெல் வெடிப்பு சிகிச்சை?", "பருத்திக்கு உரம்?", "விவசாயி திட்டங்கள்?"],
  kn: ["ಕಪ್ಪು ಮಣ್ಣಿಗೆ ಬೆಳೆ?", "ನಾಳಿನ ಹವಾಮಾನ?", "ಭತ್ತದ ಬ್ಲಾಸ್ಟ್ ಪರಿಹಾರ?", "ಹತ್ತಿಗೆ ಗೊಬ್ಬರ?", "ಸರ್ಕಾರಿ ಯೋಜನೆ?"],
  mr: ["काळ्या मातीसाठी पीक?", "उद्याचे हवामान?", "भात ब्लास्ट उपाय?", "कापसासाठी खत?", "शेतकरी योजना?"],
};

const STATUS_LABEL: Record<Status, string> = {
  idle: "Tap the mic and ask anything",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Something went wrong",
};

function uid() { return Math.random().toString(36).slice(2, 10); }

// Web Speech API typings shim
type SRType = any;
function getSpeechRecognition(): SRType | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function VoicePage() {
  const [lang, setLang] = useState<VoiceLang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("voice.lang") as VoiceLang) || "en";
  });
  const [status, setStatus] = useState<Status>("idle");
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState<VoiceReply | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");
  const [volume, setVolume] = useState(0); // 0-1 mic level
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const callAI = useServerFn(voiceReply);

  const SR = useMemo(() => getSpeechRecognition(), []);
  const supported = !!SR && typeof window !== "undefined" && "speechSynthesis" in window;

  // Persist lang
  useEffect(() => { try { localStorage.setItem("voice.lang", lang); } catch {} }, [lang]);

  // Query permission status
  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return;
    (navigator.permissions as any).query?.({ name: "microphone" as PermissionName })
      .then((p: any) => {
        setPermission(p.state);
        p.onchange = () => setPermission(p.state);
      }).catch(() => {});
  }, []);

  // Cleanup
  useEffect(() => () => {
    stopMeter();
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    setVolume(0);
  }

  async function startMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        setVolume(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setPermission("granted");
      return true;
    } catch (e: any) {
      const denied = e?.name === "NotAllowedError" || e?.name === "SecurityError";
      setPermission(denied ? "denied" : "prompt");
      setMicError(denied
        ? "Microphone permission was denied. Allow microphone access in your browser settings and retry."
        : "Couldn't access the microphone. Check your device and try again.");
      return false;
    }
  }

  const startListening = useCallback(async () => {
    if (!supported) {
      toast.error("Voice recognition isn't supported in this browser. Try Chrome.");
      return;
    }
    setMicError(null);
    setReply(null);
    setTranscript("");
    setInterim("");
    try { window.speechSynthesis?.cancel(); } catch {}

    const ok = await startMeter();
    if (!ok) return;

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = BCP47[lang];
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = "";
    rec.onstart = () => setStatus("listening");
    rec.onresult = (e: any) => {
      let interimT = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interimT += t;
      }
      setInterim(interimT);
      if (finalText) setTranscript(finalText);
    };
    rec.onerror = (e: any) => {
      console.warn("SR error", e?.error);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setPermission("denied");
        setMicError("Microphone permission was denied. Allow access and retry.");
        setStatus("error");
        stopMeter();
        return;
      }
      if (e?.error === "no-speech" || e?.error === "audio-capture" || e?.error === "network") {
        if (retryRef.current < 1) {
          retryRef.current += 1;
          try { rec.stop(); } catch {}
          setTimeout(() => startListening(), 300);
          return;
        }
      }
      setStatus("error");
      setMicError("Speech recognition failed. Please try again.");
      stopMeter();
    };
    rec.onend = async () => {
      stopMeter();
      retryRef.current = 0;
      const text = (finalText || interim).trim();
      if (!text) {
        setStatus("idle");
        return;
      }
      setTranscript(text);
      setInterim("");
      await askAI(text);
    };

    try { rec.start(); } catch (err) {
      console.warn(err);
      setStatus("error");
      setMicError("Could not start the microphone. Try again.");
      stopMeter();
    }
  }, [SR, lang, supported, interim]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  async function askAI(message: string) {
    setStatus("thinking");
    const nextHistory: Turn[] = [...history, { id: uid(), role: "user", text: message }];
    try {
      const r = await callAI({
        data: {
          message,
          language: lang,
          history: nextHistory.slice(-8).map(({ role, text }) => ({ role, text })),
        },
      });
      setReply(r);
      setHistory([...nextHistory, { id: uid(), role: "assistant", text: r.reply }]);
      if (!muted) speak(r.reply);
      else setStatus("idle");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach the assistant. Please try again.");
      setStatus("error");
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("idle");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = BCP47[lang];
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang?.toLowerCase().startsWith(BCP47[lang].toLowerCase()))
        || voices.find((v) => v.lang?.toLowerCase().startsWith(lang));
      if (match) u.voice = match;
      u.rate = 1; u.pitch = 1; u.volume = 1;
      u.onstart = () => setStatus("speaking");
      u.onend = () => setStatus("idle");
      u.onerror = () => setStatus("idle");
      window.speechSynthesis.speak(u);
    } catch {
      setStatus("idle");
    }
  }

  function replay() {
    if (reply?.reply) speak(reply.reply);
  }

  function stopSpeaking() {
    try { window.speechSynthesis.cancel(); } catch {}
    setStatus("idle");
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      <BackgroundOrbs status={status} />
      <div className="relative mx-auto max-w-3xl px-4 pt-6 sm:pt-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Voice Assistant
          </div>
          <LangSelect lang={lang} onChange={setLang} />
        </div>

        {!supported && (
          <Notice tone="warn"
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Voice not supported"
            body="Your browser doesn't support speech recognition. Try Chrome on Android or desktop." />
        )}

        {permission === "denied" && (
          <Notice tone="error"
            icon={<MicOff className="h-4 w-4" />}
            title="Microphone blocked"
            body="Open your browser settings, allow microphone access for this site, then retry."
            action={<button onClick={() => { setMicError(null); setPermission("prompt"); startListening(); }}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">Retry</button>}
          />
        )}

        {micError && permission !== "denied" && (
          <Notice tone="error" icon={<AlertTriangle className="h-4 w-4" />}
            title="Mic error" body={micError}
            action={<button onClick={() => { setMicError(null); startListening(); }}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">Retry</button>}
          />
        )}

        {/* Orb */}
        <div className="relative mt-8 flex flex-col items-center">
          <Orb status={status} volume={volume} />
          <div className="mt-6 text-sm font-medium text-muted-foreground">
            {STATUS_LABEL[status]}
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {status === "listening" ? (
              <PrimaryButton onClick={stopListening} tone="stop"><Square className="h-4 w-4" /> Stop</PrimaryButton>
            ) : (
              <PrimaryButton onClick={startListening} disabled={status === "thinking"}>
                <Mic className="h-4 w-4" /> {status === "speaking" ? "Ask again" : "Start listening"}
              </PrimaryButton>
            )}
            {reply && (
              <button onClick={status === "speaking" ? stopSpeaking : replay}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5">
                {status === "speaking" ? <><VolumeX className="h-4 w-4" /> Stop voice</> : <><RotateCcw className="h-4 w-4" /> Replay</>}
              </button>
            )}
            <button onClick={() => setMuted((m) => !m)}
              title={muted ? "Voice replies off" : "Voice replies on"}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/60 px-3 py-2 text-sm font-medium backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Waveform */}
          <Waveform active={status === "listening"} volume={volume} />
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {(transcript || interim) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-auto mt-8 max-w-2xl rounded-3xl border border-white/40 bg-white/60 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> You said
              </div>
              <p className="mt-1 text-base leading-relaxed">
                {transcript}
                {interim && <span className="text-muted-foreground"> {interim}</span>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply card */}
        <AnimatePresence>
          {reply && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-auto mt-4 max-w-2xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-white/60 to-teal-500/10 p-5 backdrop-blur-2xl dark:from-emerald-500/10 dark:via-white/5 dark:to-teal-500/10">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" /> Assistant
              </div>
              <p className="mt-1 text-base leading-relaxed">{reply.reply}</p>
              {reply.suggestions?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {reply.suggestions.map((s, i) => (
                    <button key={i} onClick={() => askAI(s)}
                      className="rounded-full border border-emerald-500/30 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:bg-white/10 dark:text-emerald-200">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Starter chips */}
        {!reply && !transcript && (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {STARTERS[lang].map((q, i) => (
              <button key={i} onClick={() => askAI(q)}
                className="rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- pieces ----------
function BackgroundOrbs({ status }: { status: Status }) {
  const tone = status === "listening" ? "from-rose-300/40 to-amber-300/30"
    : status === "thinking" ? "from-violet-300/40 to-indigo-300/30"
    : status === "speaking" ? "from-emerald-300/40 to-teal-300/30"
    : "from-emerald-200/30 to-sky-200/30";
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div animate={{ scale: status === "idle" ? 1 : 1.1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className={cn("absolute -top-32 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl", tone)} />
    </div>
  );
}

function Orb({ status, volume }: { status: Status; volume: number }) {
  const scale = status === "listening" ? 1 + volume * 0.25
    : status === "speaking" ? 1.05
    : status === "thinking" ? 1.02 : 1;
  return (
    <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5 }}
          className={cn("absolute inset-0 rounded-full border",
            status === "listening" ? "border-rose-400/60"
              : status === "speaking" ? "border-emerald-400/60"
              : status === "thinking" ? "border-violet-400/60"
              : "border-primary/40")} />
      ))}
      <motion.div animate={{ scale }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={cn(
          "relative flex h-40 w-40 items-center justify-center rounded-full shadow-[0_20px_80px_-20px_rgba(16,185,129,0.6)] sm:h-44 sm:w-44",
          "bg-gradient-to-br",
          status === "listening" ? "from-rose-400 via-orange-400 to-amber-400"
            : status === "speaking" ? "from-emerald-400 via-teal-400 to-cyan-400"
            : status === "thinking" ? "from-violet-400 via-indigo-400 to-blue-400"
            : "from-emerald-400 via-teal-400 to-sky-400",
        )}>
        {status === "thinking" ? <Loader2 className="h-10 w-10 animate-spin text-white" />
          : status === "speaking" ? <Volume2 className="h-10 w-10 text-white" />
          : <Mic className="h-10 w-10 text-white" />}
      </motion.div>
    </div>
  );
}

function Waveform({ active, volume }: { active: boolean; volume: number }) {
  const bars = 28;
  return (
    <div className="mt-6 flex h-12 items-end justify-center gap-1">
      {Array.from({ length: bars }).map((_, i) => {
        const seed = Math.sin(i * 1.7) * 0.5 + 0.5;
        const h = active ? Math.max(4, (volume * 40 + seed * 16) * (0.6 + Math.random() * 0.8)) : 4 + seed * 6;
        return (
          <motion.span key={i}
            animate={{ height: h }}
            transition={{ duration: 0.15 }}
            className={cn("w-1 rounded-full",
              active ? "bg-gradient-to-t from-rose-400 to-amber-400" : "bg-muted-foreground/30")} />
        );
      })}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, tone }:
  { children: React.ReactNode; onClick: () => void; disabled?: boolean; tone?: "stop" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60",
        tone === "stop"
          ? "bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95"
          : "bg-gradient-to-r from-primary to-primary-glow hover:opacity-95",
      )}>
      {children}
    </button>
  );
}

function LangSelect({ lang, onChange }: { lang: VoiceLang; onChange: (l: VoiceLang) => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/60 px-2 py-1 text-xs backdrop-blur dark:border-white/10 dark:bg-white/5">
      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
      <select value={lang} onChange={(e) => onChange(e.target.value as VoiceLang)}
        className="bg-transparent text-xs font-medium outline-none">
        {VOICE_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.native}</option>
        ))}
      </select>
    </div>
  );
}

function Notice({ tone, icon, title, body, action }:
  { tone: "warn" | "error"; icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className={cn("mt-5 flex items-start gap-3 rounded-2xl border p-3 text-sm",
      tone === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200")}>
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-90">{body}</div>
      </div>
      {action}
    </div>
  );
}
