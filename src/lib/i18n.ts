export const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧", region: "Global", tts: "en-US" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳", region: "North India", tts: "hi-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", flag: "🇮🇳", region: "Andhra · Telangana", tts: "te-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", flag: "🇮🇳", region: "Tamil Nadu", tts: "ta-IN" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳", region: "Karnataka", tts: "kn-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳", region: "Maharashtra", tts: "mr-IN" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

type TranslationKey =
  | "greeting"
  | "tagline"
  | "weather"
  | "crops"
  | "disease"
  | "ask"
  | "preview"
  | "selected";

export const TRANSLATIONS: Record<LangCode, Record<TranslationKey, string>> = {
  en: {
    greeting: "Welcome, farmer",
    tagline: "Smart farming, in your language.",
    weather: "Weather",
    crops: "Crops",
    disease: "Disease",
    ask: "Ask the AI",
    preview: "Interface preview",
    selected: "Selected language",
  },
  hi: {
    greeting: "स्वागत है, किसान भाई",
    tagline: "स्मार्ट खेती, आपकी भाषा में।",
    weather: "मौसम",
    crops: "फसलें",
    disease: "रोग",
    ask: "एआई से पूछें",
    preview: "इंटरफ़ेस पूर्वावलोकन",
    selected: "चयनित भाषा",
  },
  te: {
    greeting: "స్వాగతం, రైతు గారు",
    tagline: "మీ భాషలో స్మార్ట్ వ్యవసాయం.",
    weather: "వాతావరణం",
    crops: "పంటలు",
    disease: "తెగుళ్లు",
    ask: "AI ని అడగండి",
    preview: "ఇంటర్‌ఫేస్ ప్రివ్యూ",
    selected: "ఎంచుకున్న భాష",
  },
  ta: {
    greeting: "வரவேற்கிறோம், விவசாயி",
    tagline: "உங்கள் மொழியில் ஸ்மார்ட் விவசாயம்.",
    weather: "வானிலை",
    crops: "பயிர்கள்",
    disease: "நோய்கள்",
    ask: "AI யிடம் கேளுங்கள்",
    preview: "இடைமுக முன்னோட்டம்",
    selected: "தேர்ந்தெடுத்த மொழி",
  },
  kn: {
    greeting: "ಸ್ವಾಗತ, ರೈತರೇ",
    tagline: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ.",
    weather: "ಹವಾಮಾನ",
    crops: "ಬೆಳೆಗಳು",
    disease: "ರೋಗಗಳು",
    ask: "AI ಯನ್ನು ಕೇಳಿ",
    preview: "ಇಂಟರ್‌ಫೇಸ್ ಮುನ್ನೋಟ",
    selected: "ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆ",
  },
  mr: {
    greeting: "स्वागत आहे, शेतकरी मित्रा",
    tagline: "तुमच्या भाषेत स्मार्ट शेती.",
    weather: "हवामान",
    crops: "पिके",
    disease: "रोग",
    ask: "AI ला विचारा",
    preview: "इंटरफेस पूर्वावलोकन",
    selected: "निवडलेली भाषा",
  },
};

export const LANG_STORAGE_KEY = "agro.lang";

export function getStoredLang(): LangCode {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
  return v && LANGUAGES.some((l) => l.code === v) ? v : "en";
}

export function setStoredLang(code: LangCode) {
  if (typeof window !== "undefined") localStorage.setItem(LANG_STORAGE_KEY, code);
}
