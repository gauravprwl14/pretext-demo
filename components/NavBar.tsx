"use client";

import { motion, useScroll, useTransform } from "framer-motion";

const NAV_LINKS = [
  { label: "vs DOM", href: "#comparison" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Playground", href: "#playground" },
  { label: "Use Cases", href: "#advanced" },
  { label: "Performance", href: "#performance" },
  { label: "About", href: "#about" },
];

export default function NavBar() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.1]);

  return (
    <motion.header
      style={{ backgroundColor: bg }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
    >
      <motion.div
        style={{ borderBottomColor: `rgba(255,255,255,${borderOpacity})` }}
        className="border-b"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="mono text-sm font-medium text-white">
            pretext<span className="text-white/30">.demo</span>
          </div>
          <nav className="hidden md:flex gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="mono text-xs text-white/40 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="https://github.com/chenglou/pretext"
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-xs px-3 py-1.5 border border-white/20 rounded text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            GitHub →
          </a>
        </div>
      </motion.div>
    </motion.header>
  );
}
