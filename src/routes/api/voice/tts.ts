import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/voice/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { text, voice } = (await request.json()) as {
          text?: string;
          voice?: string;
        };
        if (!text || !text.trim()) {
          return new Response("text required", { status: 400 });
        }
        // Cap to avoid model input limit issues.
        const input = text.slice(0, 3500);

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input,
            voice: voice || "alloy",
            response_format: "mp3",
            instructions:
              "Speak warmly and naturally, with a calm and friendly tone — like a helpful farming advisor.",
          }),
        });

        if (!upstream.ok) {
          const t = await upstream.text().catch(() => "");
          return new Response(`TTS failed: ${upstream.status} ${t}`, {
            status: upstream.status,
          });
        }
        return new Response(upstream.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
