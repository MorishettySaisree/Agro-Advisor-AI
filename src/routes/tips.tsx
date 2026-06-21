import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Droplets, Bug, Sprout, Sun, CloudRain, Snowflake, Leaf, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Daily Farming Tips — Agro Advisor" },
      { name: "description", content: "Daily AI-curated farming tips: seasonal advice, pest prevention and irrigation guidance." },
    ],
  }),
  component: TipsPage,
});

type Tip = {
  id: string;
  category: "Daily" | "Seasonal" | "Pest" | "Irrigation";
  title: string;
  body: string;
  icon: typeof Sprout;
  accent: string;
};

const DAILY_TIPS: Tip[] = [
  { id: "d1", category: "Daily", title: "Scout before sunrise", body: "Walk one bund per day at dawn. Many pests and diseases are visible early — yellow patches, wilting tips, egg masses on leaf undersides.", icon: Sprout, accent: "from-primary to-primary-glow" },
  { id: "d2", category: "Daily", title: "Check soil moisture by hand", body: "Push a finger 4 inches into the root zone. Sticky = wait. Crumbly but cool = irrigate today. Dusty = overdue.", icon: Droplets, accent: "from-sky to-sky/70" },
  { id: "d3", category: "Daily", title: "Compost the kitchen waste", body: "1 kg of vegetable peel + dried leaves + cow dung slurry, turned weekly, becomes free organic manure in 45 days.", icon: Leaf, accent: "from-earth to-earth/70" },
  { id: "d4", category: "Daily", title: "Inspect irrigation pipes", body: "A 2 mm pinhole leak wastes ~500 L per day. Walk the drip line for the first 10 min of each cycle.", icon: Droplets, accent: "from-sky to-primary" },
  { id: "d5", category: "Daily", title: "Record one observation", body: "A 1-line daily diary entry (crop, pest, weather, action) becomes the most valuable data on your farm by season's end.", icon: Lightbulb, accent: "from-sun to-destructive" },
  { id: "d6", category: "Daily", title: "Sharpen one tool", body: "Sharp sickles cut cleanly, reducing crop wounds and fungal entry. 5 minutes a day keeps every tool field-ready.", icon: Sprout, accent: "from-primary to-earth" },
  { id: "d7", category: "Daily", title: "Calibrate your sprayer", body: "Spray plain water over a measured strip. Adjust nozzle/walking speed before mixing pesticide — saves chemicals and crop.", icon: Droplets, accent: "from-primary-glow to-sky" },
];

const SEASONAL: Tip[] = [
  { id: "s1", category: "Seasonal", title: "Kharif (Jun–Oct) sowing window", body: "Sow within 7 days of the first 75 mm cumulative rainfall. Late sowing reduces yield 1.5–2% per day delay.", icon: CloudRain, accent: "from-sky to-primary" },
  { id: "s2", category: "Seasonal", title: "Rabi (Nov–Apr) seedbed", body: "After Kharif harvest, deep plough once and 2 cross-harrows. Sow wheat between Nov 5–25 for max grain weight.", icon: Snowflake, accent: "from-sky to-primary-glow" },
  { id: "s3", category: "Seasonal", title: "Zaid (Mar–Jun) crops", body: "Short-duration moong, cowpea and vegetables fix nitrogen and bridge the income gap before Kharif.", icon: Sun, accent: "from-sun to-destructive" },
  { id: "s4", category: "Seasonal", title: "Pre-monsoon prep", body: "2 weeks before monsoon: clean field drains, repair bunds, stock seed treatment fungicide and 1 spare seed bag.", icon: CloudRain, accent: "from-sky to-earth" },
];

const PEST: Tip[] = [
  { id: "p1", category: "Pest", title: "Yellow sticky traps", body: "Install 8–10 yellow sticky traps per acre 1 ft above canopy. Catches whitefly, aphids and leafminer adults before outbreak.", icon: Bug, accent: "from-sun to-destructive" },
  { id: "p2", category: "Pest", title: "Neem oil rotation", body: "Spray 5 ml/L neem oil + 1 ml/L soap at 10-day intervals as preventive. Rotate with Bt for caterpillars.", icon: Leaf, accent: "from-primary to-primary-glow" },
  { id: "p3", category: "Pest", title: "Pheromone traps for borers", body: "4 traps/acre for stem borer (rice), pink bollworm (cotton). Replace lure every 21 days.", icon: Bug, accent: "from-destructive to-sun" },
  { id: "p4", category: "Pest", title: "Encourage beneficials", body: "Plant marigold, coriander or sesame on bunds. They host ladybird beetles and spiders that eat aphids and mites.", icon: Sprout, accent: "from-primary to-earth" },
];

const IRRIGATION: Tip[] = [
  { id: "i1", category: "Irrigation", title: "Irrigate early morning or late evening", body: "Cuts evaporation losses by 30–40% vs midday irrigation. Also reduces leaf scorch on hot days.", icon: Droplets, accent: "from-sky to-primary" },
  { id: "i2", category: "Irrigation", title: "Critical-stage rule", body: "Never miss water at: crown root (wheat), panicle initiation (rice), flowering (cotton/pulses), tuber bulking (potato).", icon: Sprout, accent: "from-primary to-primary-glow" },
  { id: "i3", category: "Irrigation", title: "Drip beats flood for row crops", body: "Drip on cotton/tomato uses 40–60% less water and gives 20–30% higher yield. PMKSY pays up to 55% subsidy.", icon: Droplets, accent: "from-sky to-primary-glow" },
  { id: "i4", category: "Irrigation", title: "Mulch + irrigate", body: "5 cm of straw or polythene mulch holds 25% more soil moisture. Cuts weed labour too.", icon: Leaf, accent: "from-earth to-primary" },
];

const TABS = [
  { key: "Daily" as const, label: "Today's tips", icon: Lightbulb, list: DAILY_TIPS },
  { key: "Seasonal" as const, label: "Seasonal", icon: Calendar, list: SEASONAL },
  { key: "Pest" as const, label: "Pest prevention", icon: Bug, list: PEST },
  { key: "Irrigation" as const, label: "Irrigation", icon: Droplets, list: IRRIGATION },
];

function TipsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("Daily");

  const tipOfDay = useMemo(() => {
    const idx = new Date().getDate() % DAILY_TIPS.length;
    return DAILY_TIPS[idx];
  }, []);

  const list = TABS.find((t) => t.key === tab)!.list;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
          <Lightbulb className="h-3 w-3 text-primary" /> Daily farming wisdom
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Tips that grow your yield</h1>
        <p className="mt-3 text-base text-muted-foreground">Curated daily advice, seasonal playbooks, pest prevention and irrigation guidance.</p>
      </div>

      {/* Tip of the day hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-primary-glow/10 to-sun/10 p-6 sm:p-10"
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Tip of the day</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">{tipOfDay.title}</h2>
        <p className="mt-3 max-w-2xl text-base text-foreground/85">{tipOfDay.body}</p>
      </motion.div>

      {/* Tabs */}
      <div className="mt-10 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((tip, i) => (
          <motion.article
            key={tip.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex h-full flex-col gap-3 rounded-3xl border border-border/60 bg-card p-5"
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tip.accent} text-white shadow-md`}>
              <tip.icon className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold leading-snug">{tip.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{tip.body}</p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
