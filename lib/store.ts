// Backend: GitHub Issues as data store.
// Each submitted sky = one issue in DATA_REPO labelled `slice`.
// Body of the issue is JSON of { color_hex, city, country, lat, lng }.
// captured_at = issue.created_at (GitHub timestamps, no clock skew).
//
// Why this and not Supabase: zero account setup. The gh CLI on the
// developer's machine already provides a token via `gh auth token`.

import "server-only";

const DATA_OWNER = "Jada-Q";
const DATA_REPO = "sky-slices-data";
const LABEL = "slice";
const API = "https://api.github.com";

export type SkySlice = {
  id: number;
  color_hex: string;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  captured_at: string;
};

function token(): string {
  const t = process.env.GITHUB_TOKEN?.trim();
  if (!t) {
    throw new Error(
      "Missing GITHUB_TOKEN. Run `gh auth token > .env.local` or set it manually.",
    );
  }
  return t;
}

function headers() {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token()}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sky-slices/0.1",
    "Content-Type": "application/json",
  };
}

type RawIssue = {
  number: number;
  body: string | null;
  created_at: string;
};

export async function listSlices(limit = 200): Promise<SkySlice[]> {
  const url = new URL(`${API}/repos/${DATA_OWNER}/${DATA_REPO}/issues`);
  url.searchParams.set("labels", LABEL);
  url.searchParams.set("state", "open");
  url.searchParams.set("per_page", String(Math.min(limit, 100)));
  url.searchParams.set("sort", "created");
  url.searchParams.set("direction", "desc");

  const res = await fetch(url, {
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GitHub list issues failed: ${res.status} ${res.statusText}`);
  }

  const issues = (await res.json()) as RawIssue[];

  return issues
    .map((i) => parseIssue(i))
    .filter((s): s is SkySlice => s !== null)
    .slice(0, limit);
}

function parseIssue(i: RawIssue): SkySlice | null {
  if (!i.body) return null;
  try {
    const data = JSON.parse(i.body) as Partial<SkySlice>;
    if (!data.color_hex || !/^#[0-9a-f]{6}$/i.test(data.color_hex)) return null;
    if (!data.city || typeof data.city !== "string") return null;
    return {
      id: i.number,
      color_hex: data.color_hex.toLowerCase(),
      city: data.city,
      country: data.country ?? null,
      lat: typeof data.lat === "number" ? data.lat : null,
      lng: typeof data.lng === "number" ? data.lng : null,
      captured_at: i.created_at,
    };
  } catch {
    return null;
  }
}

type CreateInput = {
  color_hex: string;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

export async function createSlice(input: CreateInput): Promise<SkySlice> {
  const safeCity = input.city.slice(0, 80);
  const title = `${safeCity} · ${input.color_hex}`;
  const body = JSON.stringify({
    color_hex: input.color_hex.toLowerCase(),
    city: safeCity,
    country: input.country,
    lat: input.lat,
    lng: input.lng,
  });

  const res = await fetch(
    `${API}/repos/${DATA_OWNER}/${DATA_REPO}/issues`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ title, body, labels: [LABEL] }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub create issue failed: ${res.status} ${text}`);
  }

  const issue = (await res.json()) as RawIssue;
  const parsed = parseIssue(issue);
  if (!parsed) throw new Error("Created issue did not parse back");
  return parsed;
}
