import { Link } from "@tanstack/react-router";
import { Sprout, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/weather", label: "Weather" },
  { to: "/crops", label: "Crops" },
  { to: "/disease", label: "Disease" },
  { to: "/market", label: "Market" },
  { to: "/schemes", label: "Schemes" },
  { to: "/tips", label: "Tips" },
  { to: "/services", label: "Nearby" },
  { to: "/chat", label: "Chat" },
  { to: "/voice", label: "Voice" },
  { to: "/languages", label: "Languages" },
  { to: "/testimonials", label: "Stories" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform group-hover:scale-105">
              <Sprout className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">Agro Advisor</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                AI for Farmers
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95">
              <Link to="/chat">Ask AI</Link>
            </Button>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/50"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 p-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground/80 hover:bg-accent"
                  activeProps={{ className: "bg-accent text-foreground" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
