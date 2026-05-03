"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SkySlice = {
  id: number;
  color_hex: string;
  city: string;
  country: string | null;
  captured_at: string;
};

const POLL_MS = 12_000;

function relativeTime(iso: string): string {
  const diffSec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

export default function WallPage() {
  const [slices, setSlices] = useState<SkySlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/slices", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { slices?: SkySlice[]; error?: string };
        if (cancelled.current) return;
        if (data.error) {
          setError(data.error);
        } else if (data.slices) {
          setSlices(data.slices);
          setError(null);
        }
      } catch (e) {
        if (!cancelled.current) setError(e instanceof Error ? e.message : "load failed");
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, POLL_MS);

    return () => {
      cancelled.current = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-medium tracking-tight">此刻的天空</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {loading
              ? "正在加载…"
              : error
                ? `加载失败：${error}`
                : `${slices.length} 片来自世界各地的天空 · 每 ${POLL_MS / 1000}s 自动刷新`}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm border border-neutral-300 rounded-full hover:bg-neutral-100 transition-colors whitespace-nowrap"
        >
          + 添加你的
        </Link>
      </header>

      <section className="flex-1 p-3">
        {!loading && slices.length === 0 && !error && (
          <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
            墙上还没有天空。
            <Link href="/" className="ml-2 underline hover:text-neutral-700">
              你来当第一片？
            </Link>
          </div>
        )}

        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          {slices.map((s) => (
            <article
              key={s.id}
              className="group relative aspect-square rounded-md overflow-hidden border border-neutral-200/50 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: s.color_hex }}
              title={`${s.city} · ${relativeTime(s.captured_at)} · ${s.color_hex}`}
            >
              <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/50 to-transparent text-white text-[10px] tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="font-medium truncate">{s.city}</div>
                <div className="opacity-80">{relativeTime(s.captured_at)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
