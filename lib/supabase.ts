import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !anon) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env.local and fill in values from your Supabase project settings.",
  );
}

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 5 } },
});

export type SkySlice = {
  id: string;
  color_hex: string;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  captured_at: string;
};
