import { listSlices, createSlice, NOTE_MAX_LEN } from "@/lib/store";
import { rejectionReason } from "@/lib/sky-color";

// URL-y content tends to be spam; reject before it lands in a public issue.
const URL_RE = /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i;

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
  const noteRaw = typeof p.note === "string" ? p.note.trim() : "";
  const note = noteRaw.length > 0 ? noteRaw : null;

  if (!/^#[0-9a-f]{6}$/i.test(color_hex)) {
    return Response.json({ error: "invalid color_hex" }, { status: 400 });
  }
  if (!city || city.length > 80) {
    return Response.json({ error: "invalid city" }, { status: 400 });
  }
  if (note !== null) {
    if (note.length > NOTE_MAX_LEN) {
      return Response.json(
        { error: `太长了——${NOTE_MAX_LEN} 字以内吧` },
        { status: 400 },
      );
    }
    if (URL_RE.test(note)) {
      return Response.json(
        { error: "里面留链接就不挂了。" },
        { status: 400 },
      );
    }
  }
  const reason = rejectionReason(color_hex);
  if (reason) {
    return Response.json({ error: reason }, { status: 400 });
  }

  try {
    const slice = await createSlice({ color_hex, city, country, lat, lng, note });
    return Response.json({ slice }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "create failed" },
      { status: 500 },
    );
  }
}
