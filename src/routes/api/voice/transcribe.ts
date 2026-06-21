import { createFileRoute } from "@tanstack/react-router";

const LANG_MAP: Record<string, string> = {
  en: "en",
  hi: "hi",
  te: "te",
  ta: "ta",
  kn: "kn",
  mr: "mr",
};

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const inForm = await request.formData();
        const file = inForm.get("file");
        const language = String(inForm.get("language") ?? "en");
        if (!(file instanceof Blob)) {
          return new Response("file required", { status: 400 });
        }
        if (file.size < 1024) {
          return new Response(
            JSON.stringify({ error: "Recording too short. Please try again." }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const mime = file.type.split(";")[0];
        const ext =
          ({ "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav" } as Record<string, string>)[mime] ??
          "webm";

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, `recording.${ext}`);
        const lang = LANG_MAP[language];
        if (lang) upstream.append("language", lang);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          return new Response(
            JSON.stringify({ error: `Transcription failed: ${res.status} ${txt}` }),
            { status: res.status, headers: { "content-type": "application/json" } },
          );
        }
        const data = (await res.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
