import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CloudSun,
  Sprout,
  Bug,
  Mic,
  Languages,
  Bot,
  ArrowRight,
  Sparkles,
  Leaf,
  Sun,
  Cloud,
  Landmark,
  Lightbulb,
  Star,
  TrendingUp,
  MapPin,
} from "lucide-react";
import heroFields from "@/assets/hero-fields.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agro Advisor AI — Smart Farming, Rooted in Intelligence" },
      {
        name: "description",
        content:
          "Weather forecasts, AI crop recommendations, disease diagnosis, and a farming chatbot in your language — all in one beautiful app.",
      },
      { property: "og:title", content: "Agro Advisor AI" },
      {
        property: "og:description",
        content:
          "AI for farmers: weather, crops, disease detection, and a smart assistant in your language.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: CloudSun,
    title: "10-Day Weather",
    desc: "Hyper-local forecasts, rain alerts, and heat warnings for your village.",
    href: "/weather",
    tint: "from-sky/20 to-sky/5",
    iconBg: "bg-gradient-to-br from-sky to-sky/70",
  },
  {
    icon: Sprout,
    title: "Crop Recommendation",
    desc: "AI matches the right crop to your soil, season, and rainfall.",
    href: "/crops",
    tint: "from-primary/20 to-primary/5",
    iconBg: "bg-gradient-to-br from-primary to-primary-glow",
  },
  {
    icon: Bug,
    title: "Disease Detection",
    desc: "Snap a leaf. Get diagnosis, organic cures, and prevention tips.",
    href: "/disease",
    tint: "from-destructive/15 to-destructive/5",
    iconBg: "bg-gradient-to-br from-destructive to-sun",
  },
  {
    icon: Bot,
    title: "AI Farming Chatbot",
    desc: "Ask anything — schemes, prices, pests, sowing. Get smart answers.",
    href: "/chat",
    tint: "from-earth/20 to-earth/5",
    iconBg: "bg-gradient-to-br from-earth to-earth/70",
  },
  {
    icon: Mic,
    title: "Voice Assistant",
    desc: "Speak your question in your language. Hear answers spoken back.",
    href: "/voice",
    tint: "from-accent to-secondary/40",
    iconBg: "bg-gradient-to-br from-primary-glow to-sun",
  },
  {
    icon: Languages,
    title: "Multi-Language",
    desc: "English, Telugu, Hindi, Tamil, Kannada, Marathi — switch instantly.",
    href: "/languages",
    tint: "from-sun/20 to-sun/5",
    iconBg: "bg-gradient-to-br from-sun to-destructive",
  },
  {
    icon: Landmark,
    title: "Government Schemes",
    desc: "PM Kisan, crop insurance, subsidies, and state schemes — eligibility & links.",
    href: "/schemes",
    tint: "from-primary/20 to-earth/10",
    iconBg: "bg-gradient-to-br from-primary to-earth",
  },
  {
    icon: Lightbulb,
    title: "Daily Tips",
    desc: "Today's farming tip, seasonal playbooks, pest prevention and irrigation.",
    href: "/tips",
    tint: "from-sun/15 to-primary/5",
    iconBg: "bg-gradient-to-br from-sun to-primary",
  },
  {
    icon: TrendingUp,
    title: "Market Prices",
    desc: "Daily crop prices, 30-day trends, top gainers and losers in your region.",
    href: "/market",
    tint: "from-primary-glow/20 to-primary/5",
    iconBg: "bg-gradient-to-br from-primary-glow to-primary",
  },
  {
    icon: MapPin,
    title: "Nearby Services",
    desc: "Fertilizer shops, seed stores, agri offices and hospitals around you.",
    href: "/services",
    tint: "from-sky/15 to-primary/5",
    iconBg: "bg-gradient-to-br from-sky to-primary",
  },
  {
    icon: Star,
    title: "Farmer Stories",
    desc: "Real success stories from farmers across India using Agro Advisor.",
    href: "/testimonials",
    tint: "from-earth/15 to-sun/10",
    iconBg: "bg-gradient-to-br from-earth to-sun",
  },
] as const;

function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[92vh] w-full overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <img
            src={heroFields}
            alt="Lush terraced rice fields at sunrise"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
        </div>

        {/* Floating ambient elements */}
        <motion.div
          className="absolute right-[8%] top-[18%] hidden lg:block"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sun to-destructive/80 shadow-[var(--shadow-glow)] animate-sun-pulse">
            <Sun className="h-12 w-12 text-white" strokeWidth={1.8} />
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[5%] top-[28%] hidden lg:block"
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        >
          <Cloud className="h-20 w-20 text-white/80" strokeWidth={1} />
        </motion.div>

        <motion.div
          className="absolute bottom-[18%] right-[18%] hidden md:block"
          animate={{ y: [0, -10, 0], rotate: [-2, 4, -2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="h-10 w-10 text-primary drop-shadow-lg" />
        </motion.div>

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-4 pt-16 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-foreground/80 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered • Built for farmers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 max-w-4xl text-balance font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          >
            Empowering farmers with{" "}
            <span className="italic text-gradient-leaf">AI</span> and smart{" "}
            <span className="italic">agriculture</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-2xl text-balance text-base text-foreground/75 sm:text-lg"
          >
            Weather forecasts, crop recommendations, disease diagnosis, and an
            AI farming assistant — in your own language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-primary to-primary-glow px-7 text-base font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
            >
              <Link to="/chat">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-border/60 bg-background/80 px-7 text-base font-semibold backdrop-blur"
            >
              <a href="#features">Explore features</a>
            </Button>
          </motion.div>

          {/* Floating chatbot preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 w-full max-w-xl"
          >
            <div className="glass rounded-3xl p-5 text-left shadow-[var(--shadow-elegant)]">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                  <Sprout className="h-4 w-4" />
                </div>
                Agro Advisor AI
              </div>
              <p className="mt-3 text-sm text-foreground/90">
                <span className="font-semibold">Farmer:</span> Which crop should I plant in black soil this Kharif?
              </p>
              <p className="mt-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-foreground">
                For black soil in Kharif (June–Oct), <b>cotton</b> and{" "}
                <b>soybean</b> perform best. Ensure 75–100 cm rainfall and good
                drainage. Want a fertilizer plan?
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative bg-background py-24 sm:py-32">
        <div className="bg-grain absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Everything a modern farm needs
            </p>
            <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
              A toolkit as practical as a plough,
              <br />
              as smart as a satellite.
            </h2>
            <p className="mt-5 text-base text-muted-foreground">
              Six tightly designed tools that turn data into decisions you can
              act on today.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Link
                  to={f.href}
                  className={`group relative block h-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br ${f.tint} p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]`}
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ${f.iconBg}`}
                  >
                    <f.icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { k: "10", v: "Crops supported" },
            { k: "6", v: "Languages" },
            { k: "10-day", v: "Forecasts" },
            { k: "24/7", v: "AI assistant" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <p className="font-display text-5xl text-primary">{s.k}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-[oklch(0.4_0.12_160)] p-10 text-primary-foreground sm:p-16">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl" />
            <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-sun/40 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-foreground/80">
                Built for every farmer
              </p>
              <h3 className="mt-4 max-w-2xl font-display text-4xl leading-[1.1] sm:text-5xl">
                Grow more. Worry less. Talk to your farm's AI today.
              </h3>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-background px-7 text-base font-semibold text-foreground hover:bg-background/90"
                >
                  <Link to="/chat">Ask AI now</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-primary-foreground/30 bg-transparent px-7 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link to="/dashboard">View dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
