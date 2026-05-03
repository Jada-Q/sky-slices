import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Cormorant_Garamond,
  Noto_Serif_SC,
} from "next/font/google";
import "./globals.css";
import { TimeOfDayBackground } from "./time-of-day";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif used for hero + cinematic caption. Light/regular
// weights only — bolder weights betray the quiet feel.
const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// CJK serif companion. Cormorant has no CJK glyphs, so Chinese in the
// hero/caption falls back to system sans without this. Loaded only at
// the weights we use to keep the hit small.
const notoSerifSC = Noto_Serif_SC({
  variable: "--font-serif-cjk",
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Sky Slices — 你窗外的天空，是什么颜色？",
  description:
    "全世界此刻的天空，拼成一面墙。Pick the color of the sky outside your window right now and see it next to slices from everyone else, everywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${notoSerifSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TimeOfDayBackground />
        {children}
      </body>
    </html>
  );
}
