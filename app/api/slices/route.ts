import { listSlices, createSlice } from "@/lib/store";
import { rejectionReason } from "@/lib/sky-color";

export async function GET() {
  try {
    const slices = await listSlices();
    return Response.json(
      { slices },
      {
        headers: {
          // Tell the browser to revalidate; server caches via fetch revalidate.
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "list failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const p = payload as Record<string, unknown>;
  const color_hex = typeof p.color_hex === "string" ? p.color_hex.trim().toLowerCase() : "";
  const city = typeof p.city === "string" ? p.city.trim() : "";
  const country = typeof p.country === "string" ? p.country : null;
  const lat = typeof p.lat === "number" ? p.lat : null;
  const lng = typeof p.lng === "number" ? p.lng : null;

  if (!/^#[0-9a-f]{6}$/i.test(color_hex)) {
    return Response.json({ error: "invalid color_hex" }, { status: 400 });
  }
  if (!city || city.length > 80) {
    return Response.json({ error: "invalid city" }, { status: 400 });
  }
  const reason = rejectionReason(color_hex);
  if (reason) {
    return Response.json({ error: reason }, { status: 400 });
  }

  try {
    const slice = await createSlice({ color_hex, city, country, lat, lng });
    return Response.json({ slice }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "create failed" },
      { status: 500 },
    );
  }
}
