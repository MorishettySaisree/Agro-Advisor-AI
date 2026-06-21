import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const SUPPORTED_CROPS = [
  "Rice", "Cotton", "Tomato", "Potato", "Wheat",
  "Maize", "Chilli", "Groundnut", "Sugarcane",
] as const;

export const SOIL_TYPES = [
  "Black Soil", "Red Soil", "Sandy Soil", "Clay Soil", "Loamy Soil",
] as const;

const Input = z.object({
  location: z.string().trim().min(2).max(120),
  soil: z.enum(SOIL_TYPES),
  ph: z.number().min(0).max(14).optional(),
  nitrogen: z.number().min(0).max(500).optional(),
  phosphorus: z.number().min(0).max(500).optional(),
  potassium: z.number().min(0).max(500).optional(),
  temperature: z.number().min(-20).max(60).optional(),
  rainfall: z.number().min(0).max(5000).optional(),
});

export type CropInput = z.infer<typeof Input>;

// Image library — stable Unsplash photos per crop
const CROP_IMAGES: Record<string, string> = {
  Rice:      "https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?w=900&q=80",
  Cotton:    "https://images.unsplash.com/photo-1594641223238-f3f5b06c8e21?w=900&q=80",
  Tomato:    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=80",
  Potato:    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=80",
  Wheat:     "https://images.unsplash.com/photo-1574323347407-f5e1c5a1ec21?w=900&q=80",
  Maize:     "https://images.unsplash.com/photo-1601593768797-9d92ade4f8cd?w=900&q=80",
  Chilli:    "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=900&q=80",
  Groundnut: "https://images.unsplash.com/photo-1567892737950-30c4db748605?w=900&q=80",
  Sugarcane: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=900&q=80",
};

// Simple, schema-friendly (no enums, minimal constraints) to avoid Gemini state explosion.
const CropCard = z.object({
  cropName: z.string(),
  confidence: z.number(),
  season: z.string(),
  waterRequirement: z.string(),
  soilSuitability: z.string(),
  expectedYield: z.string(),
  fertilizer: z.string(),
  marketDemand: z.string(),
  profitability: z.string(),
  description: z.string(),
});

const ResponseSchema = z.object({
  primary: CropCard,
  alternatives: z.array(CropCard),
});

export type CropRecommendation = z.infer<typeof CropCard> & { imageUrl: string };
export type Recommendation = {
  primary: CropRecommendation;
  alternatives: CropRecommendation[];
};

function pickImage(name: string): string {
  const key = Object.keys(CROP_IMAGES).find(
    (k) => k.toLowerCase() === name.trim().toLowerCase(),
  );
  return CROP_IMAGES[key ?? "Rice"] ?? CROP_IMAGES.Rice;
}

function fallback(data: CropInput): Recommendation {
  const base = {
    season: "Kharif",
    waterRequirement: "Moderate",
    soilSuitability: "Good",
    expectedYield: "3-5 tons/hectare",
    fertilizer: "NPK 20:20:0",
    marketDemand: "High",
    profitability: "Moderate",
  };
  return {
    primary: {
      cropName: "Rice",
      confidence: 70,
      description: `Based on general suitability for ${data.soil.toLowerCase()} in ${data.location}, rice is a reliable choice. Please verify with local agri-extension.`,
      imageUrl: pickImage("Rice"),
      ...base,
    },
    alternatives: [
      { cropName: "Maize", confidence: 62, description: "Versatile cereal with steady demand.", imageUrl: pickImage("Maize"), ...base, season: "Kharif" },
      { cropName: "Cotton", confidence: 58, description: "Cash crop suitable for many Indian regions.", imageUrl: pickImage("Cotton"), ...base, season: "Kharif" },
    ],
  };
}

async function generateOnce(data: CropInput) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);

  const optional = [
    data.ph !== undefined ? `pH: ${data.ph}` : null,
    data.nitrogen !== undefined ? `N: ${data.nitrogen} kg/ha` : null,
    data.phosphorus !== undefined ? `P: ${data.phosphorus} kg/ha` : null,
    data.potassium !== undefined ? `K: ${data.potassium} kg/ha` : null,
    data.temperature !== undefined ? `Avg temp: ${data.temperature}°C` : null,
    data.rainfall !== undefined ? `Rainfall: ${data.rainfall} mm/yr` : null,
  ].filter(Boolean).join(", ");

  const prompt = `You are an expert Indian agronomist. Recommend the single best crop plus 2 alternatives for these conditions.

Location: ${data.location}
Soil: ${data.soil}
${optional || "(use sensible regional defaults)"}

Pick crop names ONLY from this list: ${SUPPORTED_CROPS.join(", ")}.
For each crop fill EVERY field as a short plain-text value:
- cropName (one of the list above)
- confidence: number 0-100
- season: e.g. "Kharif", "Rabi", "Year-round"
- waterRequirement: e.g. "Low", "Moderate", "High"
- soilSuitability: e.g. "Excellent", "Good", "Fair"
- expectedYield: e.g. "4-6 tons/hectare"
- fertilizer: e.g. "NPK 20:20:0"
- marketDemand: e.g. "Low", "Moderate", "High", "Very High"
- profitability: e.g. "Low", "Moderate", "High", "Very High"
- description: one practical sentence for the farmer
Return ONLY the structured object.`;

  const { experimental_output } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    experimental_output: Output.object({ schema: ResponseSchema }),
    prompt,
  });
  return experimental_output;
}

export const recommendCrop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<Recommendation> => {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const out = await generateOnce(data);
        const withImages = (c: z.infer<typeof CropCard>): CropRecommendation => ({
          ...c,
          confidence: Math.max(0, Math.min(100, Math.round(c.confidence))),
          imageUrl: pickImage(c.cropName),
        });
        return {
          primary: withImages(out.primary),
          alternatives: (out.alternatives ?? []).slice(0, 3).map(withImages),
        };
      } catch (e) {
        lastErr = e;
        console.warn(`[recommendCrop] attempt ${attempt + 1} failed:`, e);
      }
    }
    console.error("[recommendCrop] all attempts failed, using fallback:", lastErr);
    return fallback(data);
  });
