import type { NextConfig } from "next";

if (process.env.NEXT_PHASE === "phase-production-build") {
  if (!process.env.GITHUB_TOKEN?.trim()) {
    throw new Error(
      "Missing GITHUB_TOKEN at build time.\n" +
        "Set it in .env.local (locally: `gh auth token > tmp && echo \"GITHUB_TOKEN=$(cat tmp)\" >> .env.local && rm tmp`)\n" +
        "or in your Vercel project's environment variables before running 'next build'.",
    );
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
