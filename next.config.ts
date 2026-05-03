import type { NextConfig } from "next";

// Build-time guard: missing Supabase env vars → fail build immediately,
// not silently produce a broken bundle.
if (process.env.NEXT_PHASE === "phase-production-build") {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars at build time: ${missing.join(", ")}.\n` +
        `Set them in .env.local (or in your Vercel project settings) before running 'next build'.`,
    );
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
