export interface CropMeta {
  name: string;
  emoji: string;
  gradient: string; // tailwind from-X to-Y classes
  blurb: string;
}

export const CROP_META: Record<string, CropMeta> = {
  Rice:      { name: "Rice",      emoji: "🌾", gradient: "from-emerald-300 to-teal-500",   blurb: "Staple kharif grain, loves flooded fields." },
  Cotton:    { name: "Cotton",    emoji: "🪴", gradient: "from-orange-200 to-amber-400",   blurb: "Cash crop for black & alluvial soils." },
  Tomato:    { name: "Tomato",    emoji: "🍅", gradient: "from-rose-300 to-red-500",       blurb: "Short-cycle, high-demand vegetable." },
  Potato:    { name: "Potato",    emoji: "🥔", gradient: "from-amber-200 to-yellow-500",   blurb: "Rabi tuber thriving in cool loamy soil." },
  Wheat:     { name: "Wheat",     emoji: "🌾", gradient: "from-yellow-200 to-amber-500",   blurb: "Rabi staple for North & Central India." },
  Maize:     { name: "Maize",     emoji: "🌽", gradient: "from-yellow-300 to-lime-500",    blurb: "Versatile cereal, kharif & rabi." },
  Chilli:    { name: "Chilli",    emoji: "🌶️", gradient: "from-red-300 to-rose-600",       blurb: "High-value spice with strong exports." },
  Groundnut: { name: "Groundnut", emoji: "🥜", gradient: "from-amber-300 to-orange-600",   blurb: "Oilseed for sandy & red soils." },
  Sugarcane: { name: "Sugarcane", emoji: "🎋", gradient: "from-lime-300 to-green-600",     blurb: "Long-duration cash crop, water-heavy." },
};

export const SOIL_META: Record<string, { emoji: string; tone: string }> = {
  "Black Soil":  { emoji: "⬛", tone: "from-zinc-700 to-zinc-900" },
  "Red Soil":    { emoji: "🟥", tone: "from-red-400 to-orange-600" },
  "Sandy Soil":  { emoji: "🟨", tone: "from-amber-300 to-yellow-500" },
  "Clay Soil":   { emoji: "🟫", tone: "from-amber-700 to-stone-700" },
  "Loamy Soil":  { emoji: "🟩", tone: "from-emerald-400 to-green-700" },
};
