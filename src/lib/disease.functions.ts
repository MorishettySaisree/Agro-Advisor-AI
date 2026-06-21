import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DISEASE_CROPS = [
  "Rice","Cotton","Tomato","Potato","Wheat","Maize","Chilli","Brinjal",
] as const;

const Input = z.object({
  imageDataUrl: z.string().startsWith("data:image/").max(8_000_000),
  crop: z.enum(DISEASE_CROPS).optional(),
  notes: z.string().max(500).optional(),
});

const DiagnosisSchema = z.object({
  isPlant: z.boolean(),
  crop: z.string(),
  disease: z.string(),
  scientificName: z.string().optional(),
  healthy: z.boolean(),
  confidence: z.number().min(0).max(100),
  severity: z.enum(["None","Mild","Moderate","Severe","Critical"]),
  severityScore: z.number().min(0).max(100),
  summary: z.string(),
  symptoms: z.array(z.string()).min(1).max(6),
  causes: z.array(z.string()).min(1).max(5),
  prevention: z.array(z.string()).min(2).max(6),
  organicCure: z.array(z.string()).min(1).max(5),
  chemicalCure: z.array(z.string()).min(1).max(5),
  fertilizer: z.array(z.string()).min(1).max(4),
  recoveryTips: z.array(z.string()).min(2).max(5),
  recoveryDays: z.string(),
  spreadRisk: z.enum(["Low","Moderate","High","Very High"]),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;

export const diagnoseDisease = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const cropHint = data.crop ? `The farmer says this is a ${data.crop} plant. ` : "";
    const notesHint = data.notes ? `Additional notes: ${data.notes}. ` : "";

    const userText = `${cropHint}${notesHint}Analyse the attached photo and diagnose any plant disease.
If the image is NOT a plant or leaf, set isPlant=false and explain in summary.
Otherwise identify the most likely disease (or "Healthy" if no disease), then provide:
- confidence (0-100) and severity with severityScore (0-100)
- 2-5 symptoms, causes
- prevention steps, organic cures, chemical cures (with active ingredients & dosage like "Mancozeb 75% WP @ 2g/L"), fertilizer suggestions
- recovery tips, expected recovery time, and spread risk.
Keep it concise, farmer-friendly, no markdown.`;

    // Build OpenAI-compatible multimodal chat body (Gateway is passthrough).
    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diagnosis",
          strict: true,
          schema: zodToJsonSchema(),
        },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch {
      // Some models wrap JSON in code fences — strip them.
      const cleaned = String(raw).replace(/```(?:json)?\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    }
    return DiagnosisSchema.parse(parsed);
  });

// Hand-written JSON schema mirroring DiagnosisSchema (kept small & explicit
// because Gemini's structured-output state machine rejects very large schemas).
function zodToJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      isPlant: { type: "boolean" },
      crop: { type: "string" },
      disease: { type: "string" },
      scientificName: { type: "string" },
      healthy: { type: "boolean" },
      confidence: { type: "number" },
      severity: { type: "string", enum: ["None","Mild","Moderate","Severe","Critical"] },
      severityScore: { type: "number" },
      summary: { type: "string" },
      symptoms: { type: "array", items: { type: "string" } },
      causes: { type: "array", items: { type: "string" } },
      prevention: { type: "array", items: { type: "string" } },
      organicCure: { type: "array", items: { type: "string" } },
      chemicalCure: { type: "array", items: { type: "string" } },
      fertilizer: { type: "array", items: { type: "string" } },
      recoveryTips: { type: "array", items: { type: "string" } },
      recoveryDays: { type: "string" },
      spreadRisk: { type: "string", enum: ["Low","Moderate","High","Very High"] },
    },
    required: [
      "isPlant","crop","disease","healthy","confidence","severity","severityScore",
      "summary","symptoms","causes","prevention","organicCure","chemicalCure",
      "fertilizer","recoveryTips","recoveryDays","spreadRisk",
    ],
  };
}

