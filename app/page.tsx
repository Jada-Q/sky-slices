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

export default function PickerPage() {
  const [color, setColor] = useState("#9bb6cf");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
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
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div
            className="w-full aspect-[3/2] rounded-2xl shadow-sm border border-neutral-200"
            style={{ backgroundColor: color }}
          />
          <p className="text-neutral-600 leading-relaxed">
            谢谢你的天空。
            <br />
            它已经挂在墙上了。
          </p>
          <Link
            href="/wall"
            className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-full text-sm tracking-wide hover:bg-neutral-700 transition-colors"
          >
            去看看大家的天空 →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            你窗外的天空，
            <br />
            是什么颜色？
          </h1>
          <p className="text-sm text-neutral-500">
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
