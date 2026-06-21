import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** data.gov.in — "Current Daily Price of Various Commodities from Various Markets (Mandi)" */
const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE = `https://api.data.gov.in/resource/${RESOURCE}`;

// Public sample key shipped in data.gov.in tutorials. Override via env for production.
const DEFAULT_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";

const Input = z.object({
  commodity: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  market: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(500).default(120),
});

export type MarketQuery = z.infer<typeof Input>;

export interface MarketRecord {
  id: string;
  commodity: string;
  variety: string;
  state: string;
  district: string;
  market: string;
  arrivalDate: string;          // dd/mm/yyyy from API
  minPrice: number;             // ₹/quintal
  maxPrice: number;             // ₹/quintal
  modalPrice: number;           // ₹/quintal
  unit: "quintal";
}

export interface MarketResponse {
  records: MarketRecord[];
  total: number;
  error?: string;
}

// Lightweight category lookup so the UI can offer a "Category" filter.
export const COMMODITY_CATEGORIES: Record<string, string[]> = {
  Cereals: ["Rice", "Paddy(Dhan)(Common)", "Paddy(Dhan)(Basmati)", "Wheat", "Maize", "Bajra", "Jowar", "Ragi", "Barley"],
  Pulses: ["Arhar (Tur/Red Gram)(Whole)", "Bengal Gram (Gram)(Whole)", "Black Gram (Urd Beans)(Whole)", "Green Gram (Moong)(Whole)", "Lentil (Masur)(Whole)", "Cowpea(Lobia/Karamani)"],
  Oilseeds: ["Groundnut", "Soyabean", "Mustard", "Sunflower", "Sesamum", "Castor Seed"],
  Vegetables: ["Tomato", "Onion", "Potato", "Brinjal", "Cabbage", "Cauliflower", "Carrot", "Bhindi(Ladies Finger)", "Bottle gourd", "Bitter gourd", "Cucumbar(Kheera)", "Pumpkin", "Green Peas", "Beetroot", "Spinach"],
  Fruits: ["Mango", "Banana", "Apple", "Orange", "Grapes", "Pomegranate", "Papaya", "Guava", "Pineapple", "Watermelon", "Sapota", "Pear"],
  Spices: ["Chilli", "Dry Chillies", "Turmeric", "Coriander(Leaves)", "Coriander seed", "Cumin Seed(Jeera)", "Ginger(Dry)", "Ginger(Green)", "Garlic", "Cardamoms", "Black pepper"],
  CashCrops: ["Cotton", "Sugarcane", "Jute", "Tobacco", "Coffee", "Tea", "Rubber", "Coconut"],
};

// Quick alias map so a user typing "Rice" matches the API's "Rice" or "Paddy(Dhan)" naming.
const ALIASES: Record<string, string[]> = {
  rice: ["Rice", "Paddy(Dhan)(Common)", "Paddy(Dhan)(Basmati)"],
  paddy: ["Paddy(Dhan)(Common)", "Paddy(Dhan)(Basmati)"],
  cotton: ["Cotton"],
  tomato: ["Tomato"],
  chilli: ["Chilli", "Dry Chillies", "Green Chilli"],
  groundnut: ["Groundnut"],
  maize: ["Maize"],
  wheat: ["Wheat"],
  banana: ["Banana", "Banana - Green"],
  mango: ["Mango", "Mango (Raw-Ripe)"],
  onion: ["Onion"],
  potato: ["Potato"],
  turmeric: ["Turmeric"],
  sugarcane: ["Sugarcane"],
  soybean: ["Soyabean"],
  soyabean: ["Soyabean"],
};

function resolveCommodity(input: string): string[] {
  const k = input.trim().toLowerCase();
  return ALIASES[k] ?? [input.trim()];
}

async function fetchOne(params: URLSearchParams, signal?: AbortSignal): Promise<any> {
  const url = `${BASE}?${params.toString()}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`data.gov.in ${res.status}`);
  return res.json();
}

export const fetchMarketPrices = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<MarketResponse> => {
    const key = process.env.DATA_GOV_IN_API_KEY || DEFAULT_KEY;
    const commodities = data.commodity ? resolveCommodity(data.commodity) : [undefined];

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 15_000);

    try {
      // Run one request per commodity alias in parallel, then merge.
      const results = await Promise.all(
        commodities.map((c) => {
          const p = new URLSearchParams({
            "api-key": key,
            format: "json",
            limit: String(data.limit),
            offset: "0",
          });
          if (c) p.append("filters[commodity]", c);
          if (data.state) p.append("filters[state]", data.state);
          if (data.district) p.append("filters[district]", data.district);
          if (data.market) p.append("filters[market]", data.market);
          return fetchOne(p, ac.signal).catch((e) => {
            console.warn("[market] fetch error:", e);
            return { records: [] };
          });
        }),
      );
      clearTimeout(timeout);

      const merged: MarketRecord[] = [];
      const seen = new Set<string>();
      for (const r of results) {
        for (const row of (r.records ?? []) as any[]) {
          const id = `${row.state}|${row.district}|${row.market}|${row.commodity}|${row.variety}|${row.arrival_date}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const min = Number(row.min_price);
          const max = Number(row.max_price);
          const modal = Number(row.modal_price);
          if (!Number.isFinite(modal) || modal <= 0) continue;
          merged.push({
            id,
            commodity: String(row.commodity ?? "Unknown"),
            variety: String(row.variety ?? ""),
            state: String(row.state ?? ""),
            district: String(row.district ?? ""),
            market: String(row.market ?? ""),
            arrivalDate: String(row.arrival_date ?? ""),
            minPrice: Number.isFinite(min) ? min : modal,
            maxPrice: Number.isFinite(max) ? max : modal,
            modalPrice: modal,
            unit: "quintal",
          });
        }
      }

      return { records: merged, total: merged.length };
    } catch (e: any) {
      clearTimeout(timeout);
      console.error("[market] error:", e);
      return { records: [], total: 0, error: "Couldn't reach the market data service. Please try again." };
    }
  });
