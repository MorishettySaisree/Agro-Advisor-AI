import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ExternalLink, Landmark, ShieldCheck, Sprout, Tractor, Droplets, Search, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes — Agro Advisor" },
      { name: "description", content: "PM Kisan, crop insurance, subsidies and state schemes for Indian farmers — eligibility, benefits and apply links." },
    ],
  }),
  component: SchemesPage,
});

type Scheme = {
  id: string;
  name: string;
  category: "Central" | "Insurance" | "Subsidy" | "State";
  state?: string;
  benefit: string;
  eligibility: string;
  ministry: string;
  link: string;
  tag: string;
  icon: typeof Landmark;
};

const SCHEMES: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    category: "Central",
    benefit: "₹6,000 / year direct cash transfer in three installments",
    eligibility: "All landholding farmer families with cultivable land",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    link: "https://pmkisan.gov.in",
    tag: "Most popular",
    icon: IndianRupee,
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana",
    category: "Insurance",
    benefit: "Crop insurance against natural calamities, pests, diseases. Low premium: 2% Kharif, 1.5% Rabi, 5% horticulture.",
    eligibility: "All farmers — loanee and non-loanee — growing notified crops",
    ministry: "Ministry of Agriculture",
    link: "https://pmfby.gov.in",
    tag: "Insurance",
    icon: ShieldCheck,
  },
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC)",
    category: "Central",
    benefit: "Short-term credit up to ₹3 lakh @ 4% effective interest (with prompt repayment)",
    eligibility: "Farmers, tenant farmers, oral lessees, SHGs of farmers",
    ministry: "Department of Financial Services",
    link: "https://www.myscheme.gov.in/schemes/kcc",
    tag: "Credit",
    icon: Landmark,
  },
  {
    id: "pmksy",
    name: "PM Krishi Sinchayee Yojana",
    category: "Subsidy",
    benefit: "Up to 55% subsidy on drip irrigation for small/marginal, 45% for others",
    eligibility: "All farmers — priority to small & marginal, SC/ST, women",
    ministry: "Ministry of Jal Shakti",
    link: "https://pmksy.gov.in",
    tag: "Per Drop More Crop",
    icon: Droplets,
  },
  {
    id: "soil-health",
    name: "Soil Health Card Scheme",
    category: "Central",
    benefit: "Free soil testing report every 3 years with crop-wise nutrient recommendations",
    eligibility: "All farmers",
    ministry: "Ministry of Agriculture",
    link: "https://soilhealth.dac.gov.in",
    tag: "Free",
    icon: Sprout,
  },
  {
    id: "smam",
    name: "Sub-Mission on Agricultural Mechanization",
    category: "Subsidy",
    benefit: "40–50% subsidy on tractors, power tillers, harvesters and farm machinery",
    eligibility: "Individual farmers, FPOs, Custom Hiring Centres",
    ministry: "Ministry of Agriculture",
    link: "https://agrimachinery.nic.in",
    tag: "Machinery",
    icon: Tractor,
  },
  {
    id: "rythu-bandhu",
    name: "Rythu Bandhu",
    category: "State",
    state: "Telangana",
    benefit: "₹10,000 / acre / year investment support (₹5,000 per season)",
    eligibility: "All pattadar farmers in Telangana",
    ministry: "Govt. of Telangana",
    link: "https://rythubandhu.telangana.gov.in",
    tag: "Telangana",
    icon: IndianRupee,
  },
  {
    id: "ysr-rythu-bharosa",
    name: "YSR Rythu Bharosa",
    category: "State",
    state: "Andhra Pradesh",
    benefit: "₹13,500 / year per farmer family (incl. PM-KISAN ₹6,000)",
    eligibility: "Landholding & tenant farmer families in AP",
    ministry: "Govt. of Andhra Pradesh",
    link: "https://ysrrythubharosa.ap.gov.in",
    tag: "Andhra Pradesh",
    icon: IndianRupee,
  },
  {
    id: "mahadbt",
    name: "MahaDBT Farmer Schemes",
    category: "State",
    state: "Maharashtra",
    benefit: "Single window for subsidies on seeds, irrigation, mechanization, horticulture",
    eligibility: "Maharashtra farmers with valid Aadhaar & 7/12 extract",
    ministry: "Govt. of Maharashtra",
    link: "https://mahadbt.maharashtra.gov.in",
    tag: "Maharashtra",
    icon: ShieldCheck,
  },
];

const CATEGORIES = ["All", "Central", "Insurance", "Subsidy", "State"] as const;

function SchemesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = SCHEMES.filter((s) => {
    const matchesCat = cat === "All" || s.category === cat;
    const text = `${s.name} ${s.benefit} ${s.eligibility} ${s.state ?? ""}`.toLowerCase();
    return matchesCat && (q === "" || text.includes(q.toLowerCase()));
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
          <Landmark className="h-3 w-3 text-primary" /> Govt. of India + States
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Government schemes for farmers</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Cash transfers, crop insurance, subsidies and state programmes — with eligibility, benefits and official links.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schemes…"
            className="rounded-full pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((s, i) => (
          <motion.a
            key={s.id}
            href={s.link}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="group flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md">
                <s.icon className="h-5 w-5" />
              </span>
              <Badge variant="secondary" className="rounded-full">{s.tag}</Badge>
            </div>
            <div>
              <h3 className="text-lg font-bold leading-snug">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.ministry}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Benefit · </span>{s.benefit}</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Eligibility · </span>{s.eligibility}</p>
            </div>
            <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Visit official portal <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </motion.a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground">No schemes match your search.</p>
      )}

      <div className="mt-12 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary-glow/5 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Need help applying?</p>
        <h3 className="mt-2 font-display text-2xl">Ask the AI which schemes you qualify for</h3>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Tell our assistant your state, landholding and crop — get a personalised list of schemes you can apply to today.
        </p>
        <Link
          to="/chat"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md"
        >
          Ask the AI
        </Link>
      </div>
    </div>
  );
}
