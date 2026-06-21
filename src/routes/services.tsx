import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Locate,
  Loader2,
  MapPin,
  Sprout,
  Store,
  Building2,
  Stethoscope,
  Wheat,
  Phone,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Nearby Services — Agro Advisor AI" },
      {
        name: "description",
        content:
          "Find nearby fertilizer shops, seed stores, agriculture offices, markets and hospitals on an interactive map.",
      },
      { property: "og:title", content: "Nearby Agriculture Services" },
      {
        property: "og:description",
        content: "Map of fertilizer shops, seed stores, mandis and hospitals around your farm.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
        crossOrigin: "",
      },
    ],
  }),
  component: ServicesPage,
});

type Category = {
  id: string;
  label: string;
  icon: typeof Sprout;
  color: string;
  query: (lat: number, lon: number, r: number) => string;
};

const CATEGORIES: Category[] = [
  {
    id: "fertilizer",
    label: "Fertilizer Shops",
    icon: Sprout,
    color: "#16a34a",
    query: (lat, lon, r) => `
      node["shop"~"agrarian|garden_centre|fertilizer"](around:${r},${lat},${lon});
      way["shop"~"agrarian|garden_centre|fertilizer"](around:${r},${lat},${lon});`,
  },
  {
    id: "seeds",
    label: "Seed Stores",
    icon: Wheat,
    color: "#ca8a04",
    query: (lat, lon, r) => `
      node["shop"="agrarian"](around:${r},${lat},${lon});
      node["shop"="farm"](around:${r},${lat},${lon});`,
  },
  {
    id: "offices",
    label: "Agri Offices",
    icon: Building2,
    color: "#0ea5e9",
    query: (lat, lon, r) => `
      node["office"="government"](around:${r},${lat},${lon});
      node["amenity"="townhall"](around:${r},${lat},${lon});`,
  },
  {
    id: "markets",
    label: "Markets",
    icon: Store,
    color: "#ea580c",
    query: (lat, lon, r) => `
      node["amenity"="marketplace"](around:${r},${lat},${lon});
      way["amenity"="marketplace"](around:${r},${lat},${lon});`,
  },
  {
    id: "hospitals",
    label: "Hospitals",
    icon: Stethoscope,
    color: "#dc2626",
    query: (lat, lon, r) => `
      node["amenity"~"hospital|clinic"](around:${r},${lat},${lon});
      way["amenity"~"hospital|clinic"](around:${r},${lat},${lon});`,
  },
];

type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  categoryId: string;
  phone?: string;
  address?: string;
  distance: number;
  openingHours?: string;
  openNow?: boolean | null;
  website?: string;
};


type LatLng = { lat: number; lon: number; label: string };

const DEFAULT_LOCATION: LatLng = {
  lat: 17.385,
  lon: 78.4867,
  label: "Hyderabad, India",
};

function haversine(a: LatLng, b: { lat: number; lon: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function parseOpenNow(hours?: string): boolean | null {
  if (!hours) return null;
  const h = hours.trim();
  if (h === "24/7") return true;
  // Best-effort: match a single HH:MM-HH:MM range and assume daily.
  const m = h.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const now = new Date();
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const a = Number(m[1]) * 60 + Number(m[2]);
  const b = Number(m[3]) * 60 + Number(m[4]);
  if (a === b) return null;
  return a < b ? minsNow >= a && minsNow <= b : minsNow >= a || minsNow <= b;
}

function ServicesPage() {
  const [location, setLocation] = useState<LatLng>(DEFAULT_LOCATION);
  const [searchInput, setSearchInput] = useState("");
  const [activeCats, setActiveCats] = useState<Set<string>>(
    () => new Set(CATEGORIES.map((c) => c.id)),
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Geocode helper using Open-Meteo (no key).
  const geocode = useCallback(async (q: string): Promise<LatLng | null> => {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(q)}`,
    );
    const data = (await res.json()) as {
      results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string }>;
    };
    const r = data.results?.[0];
    if (!r) return null;
    return {
      lat: r.latitude,
      lon: r.longitude,
      label: [r.name, r.admin1].filter(Boolean).join(", "),
    };
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "Your location",
        });
      },
      () => toast.error("Couldn't get your location."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  const handleSearch = useCallback(async () => {
    const q = searchInput.trim();
    if (!q) return;
    const loc = await geocode(q);
    if (!loc) {
      toast.error("Place not found.");
      return;
    }
    setLocation(loc);
  }, [searchInput, geocode]);

  // Fetch nearby services via our server proxy (multi-mirror Overpass with retry).
  const fetchPlaces = useCallback(
    async (attempt = 0): Promise<void> => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      setLoading(true);
      setErrorMsg(null);
      if (attempt === 0) {
        setPlaces([]);
        setSelected(null);
      }
      try {
        const res = await fetch(
          `/api/public/nearby?lat=${location.lat}&lon=${location.lon}&r=12000`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          elements?: Array<{
            id: number;
            type: string;
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
          }>;
        };

        const matchCategory = (tags: Record<string, string>) => {
          const shop = tags.shop;
          const amenity = tags.amenity;
          const office = tags.office;
          if ((shop === "agrarian" || shop === "farm") && activeCats.has("seeds")) return "seeds";
          if (
            (shop === "agrarian" || shop === "garden_centre" || shop === "fertilizer") &&
            activeCats.has("fertilizer")
          )
            return "fertilizer";
          if (amenity === "marketplace" && activeCats.has("markets")) return "markets";
          if ((amenity === "hospital" || amenity === "clinic") && activeCats.has("hospitals"))
            return "hospitals";
          if ((office === "government" || amenity === "townhall") && activeCats.has("offices"))
            return "offices";
          return null;
        };

        const seen = new Set<string>();
        const list: Place[] = [];
        for (const el of data.elements ?? []) {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          const tags = el.tags ?? {};
          if (lat == null || lon == null) continue;
          const cat = matchCategory(tags);
          if (!cat) continue;
          const key = `${cat}-${Math.round(lat * 1e4)}-${Math.round(lon * 1e4)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const openingHours = tags.opening_hours;
          list.push({
            id: `${el.type}-${el.id}`,
            name: tags.name || tags["name:en"] || "Unnamed",
            lat,
            lon,
            categoryId: cat,
            phone: tags.phone || tags["contact:phone"],
            address: [tags["addr:street"], tags["addr:city"], tags["addr:state"]]
              .filter(Boolean)
              .join(", "),
            distance: haversine(location, { lat, lon }),
            openingHours,
            openNow: parseOpenNow(openingHours),
            website: tags.website || tags["contact:website"],
          });
        }
        list.sort((a, b) => a.distance - b.distance);
        setPlaces(list.slice(0, 80));
        setErrorMsg(null);
      } catch (err) {
        const message = (err as Error).message ?? "Network error";
        if (attempt < 2) {
          setErrorMsg(`Connection issue — retrying… (${attempt + 1}/3)`);
          retryTimer.current = setTimeout(() => void fetchPlaces(attempt + 1), 1500);
        } else {
          setErrorMsg(`Couldn't load nearby services (${message}).`);
          toast.error("Couldn't load nearby services. Tap retry.");
        }
      } finally {
        setLoading(false);
      }
    },
    [activeCats, location],
  );

  useEffect(() => {
    void fetchPlaces();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchPlaces]);


  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of places) m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    return m;
  }, [places]);

  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <MapPin className="h-3 w-3 text-primary" /> Around you
            </div>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Nearby <span className="text-gradient-leaf">services</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Fertilizer shops, seed stores, mandis, agri offices and hospitals near {" "}
              <span className="font-medium text-foreground">{location.label}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 shadow-[var(--shadow-soft)]">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search city or village…"
                className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button size="sm" onClick={handleSearch} className="h-8 rounded-full px-3">
                Go
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={detectLocation}
              className="h-10 rounded-full"
            >
              <Locate className="mr-1.5 h-4 w-4" />
              My location
            </Button>
          </div>
        </div>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const on = activeCats.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCats((prev) => {
                    const n = new Set(prev);
                    if (n.has(c.id)) n.delete(c.id);
                    else n.add(c.id);
                    return n.size ? n : prev;
                  });
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  on
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card text-muted-foreground"
                }`}
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: on ? c.color : "transparent" }}
                >
                  <Icon className={`h-3 w-3 ${on ? "text-white" : ""}`} style={{ color: on ? "white" : c.color }} />
                </span>
                {c.label}
                <span className="ml-1 text-[10px] opacity-70">{counts.get(c.id) ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Map + list */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative h-[480px] overflow-hidden rounded-3xl border border-border/60 shadow-[var(--shadow-elegant)]">
            <ServicesMap
              center={location}
              places={places}
              selected={selected}
              onSelect={setSelected}
            />
            {loading && (
              <div className="absolute right-3 top-3 z-[400] inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs shadow-md backdrop-blur">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Loading services…
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm font-semibold">
              <span>{places.length} places found</span>
              {errorMsg && !loading && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void fetchPlaces()}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
            <div className="max-h-[440px] overflow-y-auto">
              {loading && places.length === 0 && (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl bg-accent/30 p-3"
                    >
                      <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-accent" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-accent" />
                        <div className="h-2 w-1/2 animate-pulse rounded bg-accent" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && places.length === 0 && errorMsg && (
                <div className="p-6 text-sm">
                  <p className="font-medium text-foreground">{errorMsg}</p>
                  <p className="mt-1 text-muted-foreground">
                    OpenStreetMap servers may be busy. Try a different city or tap retry.
                  </p>
                </div>
              )}
              {!loading && places.length === 0 && !errorMsg && (
                <p className="p-6 text-sm text-muted-foreground">
                  No results in this area. Try a wider category set or different location.
                </p>
              )}

              {places.map((p, i) => {
                const cat = CATEGORIES.find((c) => c.id === p.categoryId)!;
                const Icon = cat.icon;
                const isSel = selected?.id === p.id;
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.4) }}
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition hover:bg-accent/40 ${
                      isSel ? "bg-accent/60" : ""
                    }`}
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ background: cat.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {cat.label} · {p.distance.toFixed(1)} km
                      </p>
                      {p.address && (
                        <p className="truncate text-[11px] text-muted-foreground">{p.address}</p>
                      )}
                      {p.openNow !== null && p.openNow !== undefined && (
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            p.openNow
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${p.openNow ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          {p.openNow ? "Open now" : "Closed"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-foreground/80 hover:bg-secondary/80"
                          aria-label="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        aria-label="Directions"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          Map data © OpenStreetMap contributors. Listings via Overpass API — coverage varies by
          region.
        </p>
      </div>
    </div>
  );
}

/* ---------- Map (client-only, raw Leaflet) ---------- */

function ServicesMap({
  center,
  places,
  selected,
  onSelect,
}: {
  center: LatLng;
  places: Place[];
  selected: Place | null;
  onSelect: (p: Place) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);
  const userMarkerRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let map: { setView: (...a: unknown[]) => void; remove: () => void } | null = null;

    (async () => {
      if (!ref.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      // Avoid double init under React StrictMode in dev.
      if ((ref.current as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) return;

      map = L.map(ref.current, { zoomControl: true }).setView([center.lat, center.lon], 12) as never;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map as never);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map as never);
    })();

    return () => {
      cancelled = true;
      try {
        (map as unknown as { remove: () => void } | null)?.remove();
      } catch {
        /* noop */
      }
      mapRef.current = null;
      layerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter on location change
  useEffect(() => {
    (async () => {
      const m = mapRef.current as null | { setView: (...a: unknown[]) => void };
      if (!m) return;
      const L = (await import("leaflet")).default;
      m.setView([center.lat, center.lon], 12);
      if (userMarkerRef.current) {
        (userMarkerRef.current as { remove: () => void }).remove();
      }
      const ringIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:9999px;background:oklch(0.72 0.18 142);box-shadow:0 0 0 6px oklch(0.72 0.18 142 / 0.25);border:2px solid white"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([center.lat, center.lon], { icon: ringIcon }).addTo(
        mapRef.current as never,
      );
    })();
  }, [center.lat, center.lon]);

  // Render place markers
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = layerRef.current as null | {
        clearLayers: () => void;
        addLayer: (l: unknown) => void;
      };
      if (!layer) return;
      layer.clearLayers();
      for (const p of places) {
        const cat = CATEGORIES.find((c) => c.id === p.categoryId)!;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:26px;height:26px;border-radius:9999px;background:${cat.color};border:2px solid white;box-shadow:0 6px 16px -6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:600">${cat.label[0]}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const m = L.marker([p.lat, p.lon], { icon })
          .bindPopup(
            `<div style="font-family:inherit"><strong>${escapeHtml(p.name)}</strong><br/><span style="opacity:0.7">${escapeHtml(cat.label)} · ${p.distance.toFixed(1)} km</span></div>`,
          )
          .on("click", () => onSelect(p));
        layer.addLayer(m);
      }
    })();
  }, [places, onSelect]);

  // Open popup when selected
  useEffect(() => {
    (async () => {
      if (!selected) return;
      const m = mapRef.current as null | { setView: (...a: unknown[]) => void };
      if (!m) return;
      m.setView([selected.lat, selected.lon], 14);
    })();
  }, [selected]);

  return <div ref={ref} className="h-full w-full" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
