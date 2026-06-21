import { Sprout } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <Sprout className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold tracking-tight">Agro Advisor AI</p>
              <p className="text-xs text-muted-foreground">
                Empowering farmers with intelligence rooted in the soil.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Agro Advisor. Built with care for growers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
