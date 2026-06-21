import { createFileRoute } from "@tanstack/react-router";

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function callOverpass(query: string): Promise<unknown> {
  let lastErr: unknown = null;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        lastErr = new Error(`${url} ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All Overpass mirrors failed");
}

function buildQuery(lat: number, lon: number, r: number) {
  return `[out:json][timeout:25];
(
  node["shop"~"agrarian|garden_centre|fertilizer|farm"](around:${r},${lat},${lon});
  way["shop"~"agrarian|garden_centre|fertilizer|farm"](around:${r},${lat},${lon});
  node["amenity"="marketplace"](around:${r},${lat},${lon});
  way["amenity"="marketplace"](around:${r},${lat},${lon});
  node["amenity"~"hospital|clinic"](around:${r},${lat},${lon});
  way["amenity"~"hospital|clinic"](around:${r},${lat},${lon});
  node["office"="government"](around:${r},${lat},${lon});
  node["amenity"="townhall"](around:${r},${lat},${lon});
);
out center tags 120;`;
}

export const Route = createFileRoute("/api/public/nearby")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const lat = Number(url.searchParams.get("lat"));
        const lon = Number(url.searchParams.get("lon"));
        const radius = Math.min(
          Math.max(Number(url.searchParams.get("r") ?? 12000), 1000),
          25000,
        );
        if (!isFinite(lat) || !isFinite(lon)) {
          return new Response(JSON.stringify({ error: "Invalid lat/lon" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        try {
          const data = await callOverpass(buildQuery(lat, lon, radius));
          return new Response(JSON.stringify(data), {
            headers: {
              "content-type": "application/json",
              "cache-control": "public, max-age=300",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: (err as Error).message ?? "Upstream failed" }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
