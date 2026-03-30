import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pretext Demo — Text Measurement Without DOM Reflow",
  description:
    "Interactive demos for @chenglou/pretext — measure text width and line count in pure TypeScript without getBoundingClientRect, reflow, or layout thrashing. 5000× faster than DOM measurements.",
  keywords: [
    "pretext", "text measurement", "layout", "no reflow", "TypeScript",
    "React", "virtual scroll", "canvas", "getBoundingClientRect alternative",
  ],
  authors: [{ name: "gauravprwl14", url: "https://github.com/gauravprwl14" }],
  openGraph: {
    type: "website",
    url: "https://gauravprwl14.github.io/pretext-demo/",
    title: "Pretext Demo — Text Measurement Without DOM Reflow",
    description:
      "Interactive demos for @chenglou/pretext. Measure text without touching the DOM — no reflow, no getBoundingClientRect, just pure math.",
    siteName: "pretext-demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pretext Demo — Text Measurement Without DOM Reflow",
    description:
      "Interactive demos for @chenglou/pretext. Measure text without touching the DOM — no reflow, just pure math.",
    creator: "@gauravprwl14",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
