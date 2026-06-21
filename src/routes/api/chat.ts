import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are AGRO ADVISOR AI, a warm, practical farming assistant for Indian farmers and growers worldwide.

You help with:
- Crop recommendations based on soil, season, and region
- Weather-related farming decisions
- Plant disease identification, prevention, organic and chemical cures
- Fertilizer and irrigation guidance
- Market prices, government schemes, and best practices

Style:
- Be concise, structured, and farmer-friendly (avoid jargon).
- Use short paragraphs, bullet points, and clear section headings when useful.
- When asked about regional crops, mention soil, season, and water needs.
- If a question is outside agriculture, gently redirect.
- Always be encouraging and respectful.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
