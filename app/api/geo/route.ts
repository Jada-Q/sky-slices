import { headers } from "next/headers";

type GeoResponse = {
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

const EMPTY: GeoResponse = { city: null, country: null, lat: null, lng: null };

function pickIp(forwardedFor: string | null, realIp: string | null): string | null {
  const candidate = (forwardedFor?.split(",")[0] ?? realIp ?? "").trim();
  if (!candidate) return null;
  // Local / private ranges → useless for geo lookup
  if (
    candidate.startsWith("127.") ||
    candidate.startsWith("::1") ||
    candidate.startsWith("10.") ||
    candidate.startsWith("192.168.") ||
    candidate.startsWith("172.")
  ) {
    return null;
  }
  return candidate;
}

export async function GET() {
  const h = await headers();
  const ip = pickIp(h.get("x-forwarded-for"), h.get("x-real-ip"));

  if (!ip) return Response.json(EMPTY);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "sky-slices/0.1" },
      // ipapi.co can be slow; cap the wait
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return Response.json(EMPTY);
    const data = (await res.json()) as {
      city?: string;
      country_name?: string;
      latitude?: number;
      longitude?: number;
      error?: boolean;
    };
    if (data.error) return Response.json(EMPTY);
    return Response.json({
      city: data.city ?? null,
      country: data.country_name ?? null,
      lat: typeof data.latitude === "number" ? data.latitude : null,
      lng: typeof data.longitude === "number" ? data.longitude : null,
    } satisfies GeoResponse);
  } catch {
    return Response.json(EMPTY);
  }
}
