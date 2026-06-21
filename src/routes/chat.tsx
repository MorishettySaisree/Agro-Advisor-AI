import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sprout, User, Loader2, Sparkles, Mic, Square, Lightbulb, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Agro Advisor" },
      { name: "description", content: "ChatGPT-style farming assistant — streaming answers, voice input, and source references." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Which crop suits black soil in Kharif?",
  "How do I treat rice blast organically?",
  "Best fertilizer schedule for cotton",
  "Government schemes for small farmers in India",
];

const FOLLOWUPS = [
  "Show me the spray schedule",
  "What's the best sowing date?",
  "Estimated yield and profit?",
  "Any organic alternative?",
];

function ChatPage() {
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => { console.error(err); toast.error("AI request failed."); },
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSend = useCallback(async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isLoading) return;
    setInput("");
    await sendMessage({ text: value });
    textareaRef.current?.focus();
  }, [input, isLoading, sendMessage]);

  const startRecording = useCallback(async () => {
    if (recording) return;
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { toast.error("Microphone access is needed."); return; }
    const mimeType = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    if (!mimeType) { stream.getTracks().forEach((t) => t.stop()); toast.error("Unsupported browser."); return; }
    const rec = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: rec.mimeType });
      chunksRef.current = [];
      if (blob.size < 1500) { toast.error("Too short — try again."); return; }
      setTranscribing(true);
      try {
        const form = new FormData();
        form.append("file", blob, "voice.webm");
        const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
        const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
        if (!res.ok || !data.text) { toast.error(data.error ?? "Couldn't hear you."); return; }
        await handleSend(data.text);
      } catch { toast.error("Transcription failed."); }
      finally { setTranscribing(false); }
    };
    rec.start();
    recorderRef.current = rec;
    streamRef.current = stream;
    setRecording(true);
  }, [recording, handleSend]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-4rem-1px)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="py-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Powered by Lovable AI
        </div>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Your farming co-pilot</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask about crops, weather, disease, fertilizers, or schemes.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 pr-1">
        {!hasMessages ? (
          <EmptyState onPick={handleSend} />
        ) : (
          <div className="space-y-5">
            {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Thinking…
              </div>
            )}
            {error && <p className="text-sm text-destructive">Something went wrong.</p>}
          </div>
        )}
      </div>

      {/* Follow-up chips after assistant reply */}
      {hasMessages && !isLoading && (
        <div className="mb-2 flex flex-wrap gap-2">
          {FOLLOWUPS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <Lightbulb className="h-3 w-3 text-primary" /> {s}
            </button>
          ))}
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }} className="relative mx-auto max-w-3xl">
          <div className="glass flex items-end gap-2 rounded-3xl border border-border/60 p-2 shadow-[var(--shadow-soft)] focus-within:border-primary/50 focus-within:shadow-[var(--shadow-elegant)]">
            <Button
              type="button"
              size="icon"
              variant={recording ? "destructive" : "ghost"}
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing || isLoading}
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label={recording ? "Stop recording" : "Start voice input"}
            >
              {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
              placeholder={recording ? "Listening…" : "Ask anything about your farm…"}
              rows={1}
              className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-base shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md disabled:opacity-50"
              aria-label="Send"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">AI may be inaccurate. Verify critical decisions with an agronomist.</p>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const sources = text.match(/https?:\/\/[^\s)]+/g) ?? [];

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <Sprout className="h-4 w-4" />
        </div>
      )}
      <div className={isUser ? "max-w-[85%] rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground" : "max-w-[85%] text-foreground"}>
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>
        {!isUser && sources.length > 0 && (
          <div className="mt-3 space-y-1 rounded-2xl border border-border/60 bg-card/50 p-3 text-xs">
            <p className="inline-flex items-center gap-1 font-semibold"><BookOpen className="h-3 w-3" /> Sources</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {sources.slice(0, 4).map((s) => (
                <li key={s}><a href={s} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline break-all">{s}</a></li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-earth text-earth-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center pt-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]">
        <Sprout className="h-8 w-8" strokeWidth={2.2} />
      </div>
      <p className="mt-5 font-display text-2xl">How can I help your farm today?</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Try one of these, or type / speak your own.</p>
      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-2xl border border-border/60 bg-card p-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
