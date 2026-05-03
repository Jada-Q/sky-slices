"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type SkySlice = {
  id: number;
  color_hex: string;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  captured_at: string;
};

const POLL_MS = 12_000;
const MARKER_LNGS = [-180, -90, 0, 90, 180] as const;

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

function localHourAt(lng: number, nowUtcMs: number): number {
  const utcHour = (nowUtcMs / 3_600_000) % 24;
  const local = utcHour + lng / 15;
  return ((local % 24) + 24) % 24;
}

function formatHour(h: number): string {
  return (Math.round(h) % 24).toString().padStart(2, "0") + ":00";
}

// Group slices into N longitude columns, newest on top within each column.
function bucketByColumn(slices: SkySlice[], numCols: number): SkySlice[][] {
  const buckets: SkySlice[][] = Array.from({ length: numCols }, () => []);
  for (const s of slices) {
    if (s.lng === null) continue;
    const norm = (s.lng + 180) / 360; // 0..1
    const idx = Math.min(numCols - 1, Math.max(0, Math.floor(norm * numCols)));
    buckets[idx].push(s);
  }
  // Within each column: newest first (will appear on top of the brick stack).
  for (const b of buckets) {
    b.sort(
      (a, c) =>
        new Date(c.captured_at).getTime() - new Date(a.captured_at).getTime(),
    );
  }
  return buckets;
}

function useResponsiveColumns(): number {
  const [n, setN] = useState(7);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setN(w < 640 ? 4 : w < 1024 ? 5 : 7);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return n;
}

export default function WallPage() {
  const [slices, setSlices] = useState<SkySlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [newestId, setNewestId] = useState<number | null>(null);
  const cancelled = useRef(false);
  const numCols = useResponsiveColumns();

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
          setSlices((prev) => {
            const prevTopId = prev[0]?.id ?? null;
            const nextTopId = data.slices?.[0]?.id ?? null;
            if (nextTopId !== null && nextTopId !== prevTopId && prev.length > 0) {
              setNewestId(nextTopId);
              setTimeout(() => setNewestId(null), 1500);
            }
            return data.slices ?? [];
          });
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
    const clockId = setInterval(() => setNowMs(Date.now()), 60_000);

    return () => {
      cancelled.current = true;
      clearInterval(id);
      clearInterval(clockId);
    };
  }, []);

  const columns = useMemo(
    () => bucketByColumn(slices, numCols),
    [slices, numCols],
  );
  const placedCount = columns.reduce((s, c) => s + c.length, 0);
  const unplacedCount = slices.length - placedCount;

  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-neutral-200/60 sticky top-0 z-10 backdrop-blur"
        style={{ backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)" }}
      >
        <div>
          <h1
            className="text-2xl md:text-3xl text-neutral-800 leading-tight"
            style={{
              fontFamily:
                "var(--font-serif), var(--font-serif-cjk), ui-serif, Georgia, serif",
              fontWeight: 400,
            }}
          >
            此刻的天空
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {loading
              ? "正在加载…"
              : error
                ? `加载失败：${error}`
                : `${placedCount} 片砖 · 按经度区段往上堆 · 越上面越新${
                    unplacedCount > 0 ? ` · ${unplacedCount} 片未定位` : ""
                  }`}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm border border-neutral-300 rounded-full hover:bg-neutral-100 transition-colors whitespace-nowrap"
        >
          + 添加你的
        </Link>
      </header>

      {!loading && placedCount > 0 && (
        <div className="px-6 pt-6 pb-2 select-none">
          <div
            className="grid text-[10px] tracking-[0.2em] uppercase text-neutral-400"
            style={{
              gridTemplateColumns: `repeat(${MARKER_LNGS.length}, 1fr)`,
            }}
          >
            {MARKER_LNGS.map((lng, i) => {
              const h = localHourAt(lng, nowMs);
              const align =
                i === 0
                  ? "text-left"
                  : i === MARKER_LNGS.length - 1
                    ? "text-right"
                    : "text-center";
              return (
                <div key={lng} className={align}>
                  <span className="font-mono">{formatHour(h)}</span>
                  <span className="ml-1 opacity-60">
                    {lng === 0 ? "0°" : `${lng > 0 ? "+" : ""}${lng}°`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>
      )}

      <section className="flex-1 px-6 pb-16">
        {!loading && placedCount === 0 && !error && (
          <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
            墙上还没有天空。
            <Link href="/" className="ml-2 underline hover:text-neutral-700">
              你来当第一片？
            </Link>
          </div>
        )}

        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
        >
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col"
              style={{
                // Masonry stagger: alternate columns offset by half a brick
                // (50% of column width = half block height since aspect-square).
                paddingTop: colIdx % 2 === 1 ? "50%" : 0,
              }}
            >
              {col.map((s) => (
                <article
                  key={s.id}
                  className={`breathe group relative aspect-square overflow-hidden border-t border-l border-r border-white/30 ${
                    newestId === s.id ? "brick-land" : ""
                  }`}
                  style={{
                    backgroundColor: s.color_hex,
                    animationDelay: `${(s.id * 0.31) % 7}s`,
                  }}
                  title={`${s.city} · ${relativeTime(s.captured_at)} · ${s.color_hex}${
                    s.lng !== null ? ` · ${s.lng.toFixed(1)}°` : ""
                  }`}
                >
                  <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/55 to-transparent text-white text-[10px] tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="font-medium truncate">{s.city}</div>
                    <div className="opacity-80">
                      {relativeTime(s.captured_at)}
                      {s.lng !== null && (
                        <span className="ml-2 opacity-70">
                          {s.lng > 0 ? "+" : ""}
                          {s.lng.toFixed(0)}°
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
