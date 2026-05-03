"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HexColorPicker } from "react-colorful";
import { rejectionReason } from "@/lib/sky-color";

type GeoResponse = {
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

const NOTE_MAX_LEN = 60;

export default function PickerPage() {
  const [color, setColor] = useState("#9bb6cf");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => r.json() as Promise<GeoResponse>)
      .then((g) => {
        if (cancelled) return;
        if (g.city) setCity(g.city);
        setCountry(g.country);
        setLat(g.lat);
        setLng(g.lng);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const reason = useMemo(() => rejectionReason(color), [color]);

  async function handleSubmit() {
    setError(null);
    if (!city.trim()) {
      setError("请告诉我们你在哪座城市");
      return;
    }
    if (reason) {
      setError(reason);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/slices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          color_hex: color.toLowerCase(),
          city: city.trim().slice(0, 80),
          country,
          lat,
          lng,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `提交失败 (${res.status})`);
        return;
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络问题，再试一次？");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    // Match the wall: 7 longitude columns. Slice lands at top of its column.
    const NUM_COLS = 7;
    const colIdx =
      lng !== null
        ? Math.min(
            NUM_COLS - 1,
            Math.max(0, Math.floor(((lng + 180) / 360) * NUM_COLS)),
          )
        : Math.floor(NUM_COLS / 2);
    const colCenterPct = ((colIdx + 0.5) / NUM_COLS) * 100;
    const localTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div
            className="grid text-[10px] tracking-[0.25em] uppercase text-neutral-400 fade-up-1"
            style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
          >
            <span className="text-left">00:00 -180°</span>
            <span className="text-center">06:00 -90°</span>
            <span className="text-center">12:00 0°</span>
            <span className="text-center">18:00 +90°</span>
            <span className="text-right">00:00 +180°</span>
          </div>

          {/* Wall preview: 7 column lanes; the user's slice lands at the
              top of its column. Other lanes stay empty placeholders so
              the geographic story reads at a glance. */}
          <div className="relative h-64 mt-6 fade-up-1">
            <div
              className="absolute inset-0 grid gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${NUM_COLS}, 1fr)` }}
            >
              {Array.from({ length: NUM_COLS }).map((_, i) => (
                <div
                  key={i}
                  className="border-t border-dashed border-neutral-300/70"
                  style={{
                    paddingTop: i % 2 === 1 ? "50%" : 0,
                  }}
                />
              ))}
            </div>

            {/* Highlight: thin guide line marking the user's column from
                the top edge of the wall down. Reads as a "this is where
                you land" hint while the slice is still falling. */}
            <div
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-neutral-300 via-neutral-300/40 to-transparent"
              style={{ left: `${colCenterPct}%` }}
            />

            {/* Slice + ripple at the column's top */}
            <div
              className="absolute"
              style={{
                top: 0,
                left: `${colCenterPct}%`,
                transform: "translateX(-50%)",
              }}
            >
              {/* Hanging cord */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 w-px h-2 bg-stone-400/50 fade-up-1"
              />
              <div
                className="slice-ripple absolute rounded-t-md"
                style={{
                  border: `1px solid ${color}`,
                  width: 96,
                  height: 96,
                  marginLeft: -48,
                  top: 0,
                  left: "50%",
                  position: "absolute",
                }}
              />
              <div
                className="slice-fall rounded-t-md shadow-lg border-t border-l border-r border-amber-100/40"
                style={{
                  backgroundColor: color,
                  width: 96,
                  height: 96,
                }}
              />
            </div>
          </div>

          <div className="mt-12 text-center space-y-3">
            <p
              className="fade-up-2 text-3xl md:text-4xl text-neutral-800"
              style={{ fontFamily: "var(--font-serif), var(--font-serif-cjk), ui-serif, Georgia, serif" }}
            >
              你的天空已落入
              <span className="font-medium ml-2">{city || "world"}</span>
            </p>
            {note.trim() && (
              <p
                className="fade-up-2 italic text-lg md:text-xl text-neutral-600 max-w-md mx-auto leading-relaxed"
                style={{ fontFamily: "var(--font-serif), var(--font-serif-cjk), ui-serif, Georgia, serif" }}
              >
                「{note.trim()}」
              </p>
            )}
            <p className="fade-up-2 text-[11px] tracking-[0.3em] uppercase text-neutral-400 font-mono">
              {color} · {localTime}
              {lng !== null && (
                <>
                  {" · "}
                  {lng > 0 ? "+" : ""}
                  {lng.toFixed(0)}°
                </>
              )}
            </p>
          </div>

          <div className="mt-10 text-center fade-up-3">
            <Link
              href="/wall"
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-full text-sm tracking-wide hover:bg-neutral-700 transition-colors"
            >
              去看大家的天空 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <header className="space-y-2">
          <h1
            className="text-4xl md:text-5xl leading-[1.15] text-neutral-800"
            style={{
              fontFamily: "var(--font-serif), var(--font-serif-cjk), ui-serif, Georgia, serif",
              fontWeight: 400,
            }}
          >
            你窗外的天空，
            <br />
            是什么颜色？
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            把它存起来，和此刻全世界的天空拼在一起。
          </p>
        </header>

        <div
          className="w-full h-32 rounded-2xl border border-neutral-200 transition-colors"
          style={{ backgroundColor: color }}
          aria-label="预览"
        />

        <HexColorPicker color={color} onChange={setColor} />

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-wider text-neutral-500">
            城市
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Tokyo / 上海 / Lisbon..."
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            maxLength={80}
          />
          {country && (
            <p className="text-xs text-neutral-400">检测到：{country}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label className="block text-xs uppercase tracking-wider text-neutral-500">
              想留一句话？
            </label>
            <span
              className={`text-[10px] font-mono ${
                note.length > NOTE_MAX_LEN - 10
                  ? "text-amber-600"
                  : "text-neutral-400"
              }`}
            >
              {note.length}/{NOTE_MAX_LEN}
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LEN))}
            placeholder="可选 · 给这片天空写一句"
            rows={2}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent leading-relaxed"
            maxLength={NOTE_MAX_LEN}
          />
        </div>

        {(error || reason) && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error ?? reason}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-full text-sm tracking-wide hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "上传中…" : "把这片天空挂上墙"}
          </button>
          <Link
            href="/wall"
            className="px-6 py-3 border border-neutral-300 rounded-full text-sm tracking-wide text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            墙
          </Link>
        </div>

        <footer className="pt-4 text-xs text-neutral-400 text-center">
          匿名 · 只存城市级位置 · 不收任何账号
        </footer>
      </div>
    </main>
  );
}
