import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const VOICE_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "mr", label: "Marathi", native: "मराठी" },
] as const;

export type VoiceLang = (typeof VOICE_LANGUAGES)[number]["code"];

const LANG_NAME: Record<VoiceLang, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తెలుగు)",
  ta: "Tamil (தமிழ்)",
  kn: "Kannada (ಕನ್ನಡ)",
  mr: "Marathi (मराठी)",
};

const Turn = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string(),
});

const Input = z.object({
  message: z.string().min(1).max(2000),
  language: z.enum(["en", "hi", "te", "ta", "kn", "mr"]).default("en"),
  history: z.array(Turn).max(20).optional(),
});

const ReplySchema = z.object({
  reply: z.string(),
  suggestions: z.array(z.string()),
});

export type VoiceReply = z.infer<typeof ReplySchema> & { imageQuery?: string | null };

export const voiceReply = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<VoiceReply> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const langName = LANG_NAME[data.language];

    const system = `You are AGRO ADVISOR AI, a warm spoken voice assistant for farmers.
Reply ONLY in ${langName}.
Style: 2-4 short, natural, conversational sentences a farmer can hear out loud.
No markdown, no bullet points, no emojis.
Cover crops, weather, pests, diseases, fertilizers, irrigation, market and schemes.
Be specific and practical. If you don't know, say so briefly.
Also return 2-3 short follow-up question suggestions in the same language.`;

    const transcript =
      (data.history ?? [])
        .map((t) => `${t.role === "user" ? "Farmer" : "Advisor"}: ${t.text}`)
        .join("\n") + (data.history?.length ? "\n" : "");

    const prompt = `${transcript}Farmer: ${data.message}\nAdvisor:`;

    // Try structured output; if the model fails the schema, fall back to plain text.
    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        experimental_output: Output.object({ schema: ReplySchema }),
        system,
        prompt,
      });
      return {
        reply: experimental_output.reply,
        suggestions: (experimental_output.suggestions ?? []).slice(0, 4),
      };
    } catch (e) {
      console.warn("[voiceReply] structured output failed, falling back:", e);
      try {
        const { text } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          prompt,
        });
        return { reply: text.trim(), suggestions: [] };
      } catch (err) {
        console.error("[voiceReply] text fallback failed:", err);
        return {
          reply: "Sorry, I couldn't reach the assistant right now. Please try again in a moment.",
          suggestions: [],
        };
      }
    }
  });
