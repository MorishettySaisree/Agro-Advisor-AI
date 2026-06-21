import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudSun, Sprout, Bug, TrendingUp, Bell, MapPin } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Agro Advisor" },
      { name: "description", content: "Your farm overview: weather, crops, prices, and alerts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your Farm</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Good morning, farmer</h1>
        <p className="text-muted-foreground">Here's a snapshot of today on your land.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          icon={<CloudSun className="h-5 w-5" />}
          label="Today"
          value="28°C"
          sub="Partly cloudy · 12% rain"
          tint="from-sky/20 to-sky/5"
          iconBg="bg-gradient-to-br from-sky to-sky/70"
        />
        <OverviewCard
          icon={<Sprout className="h-5 w-5" />}
          label="Recommended"
          value="Cotton"
          sub="Black soil · Kharif"
          tint="from-primary/20 to-primary/5"
          iconBg="bg-gradient-to-br from-primary to-primary-glow"
        />
        <OverviewCard
          icon={<Bug className="h-5 w-5" />}
          label="Disease alert"
          value="Low"
          sub="No outbreaks nearby"
          tint="from-destructive/15 to-destructive/5"
          iconBg="bg-gradient-to-br from-destructive to-sun"
        />
        <OverviewCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Market trend"
          value="+4.2%"
          sub="Tomato this week"
          tint="from-sun/20 to-sun/5"
          iconBg="bg-gradient-to-br from-sun to-destructive"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today's farming tips" />
          <ul className="mt-3 space-y-3 text-sm">
            <Tip text="Light rain expected tomorrow — postpone fertilizer application by 48 hours." />
            <Tip text="Inspect cotton bolls for pink bollworm at first light; early action saves yield." />
            <Tip text="Soil moisture is optimal for sowing groundnut in sandy plots." />
          </ul>
        </Card>

        <Card>
          <CardHeader title="Smart notifications" icon={<Bell className="h-4 w-4 text-primary" />} />
          <ul className="mt-3 space-y-3 text-sm">
            <li className="rounded-xl bg-secondary/60 p-3"><b>Rain alert</b> · 14mm forecast Thursday.</li>
            <li className="rounded-xl bg-accent p-3"><b>Scheme</b> · PM-KISAN installment released.</li>
            <li className="rounded-xl bg-muted p-3"><b>Market</b> · Maize up 2.1% in Guntur mandi.</li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Nearby services" icon={<MapPin className="h-4 w-4 text-primary" />} />
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {["Fertilizer Shop", "Seed Store", "Agri Office", "Mandi", "Vet Clinic", "Cold Storage"].map((s) => (
              <div key={s} className="rounded-xl border border-border/60 p-3 text-center">
                {s}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ask the AI" />
          <p className="mt-2 text-sm text-muted-foreground">
            Got a question? The Agro Advisor is one tap away.
          </p>
          <Link
            to="/chat"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open chat
          </Link>
        </Card>
      </div>
    </div>
  );
}

function OverviewCard({
  icon, label, value, sub, tint, iconBg,
}: { icon: React.ReactNode; label: string; value: string; sub: string; tint: string; iconBg: string }) {
  return (
    <div className={`rounded-3xl border border-border/60 bg-gradient-to-br ${tint} p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${iconBg}`}>{icon}</div>
      </div>
      <p className="mt-4 font-display text-4xl tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <li className="flex gap-3 rounded-xl border border-border/60 bg-background p-3">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      <span>{text}</span>
    </li>
  );
}
