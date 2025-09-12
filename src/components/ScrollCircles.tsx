"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";

interface Circle {
  size: number;
  color: string;
  angle: number;
}

export const ScrollCircles = () => {
  const { scrollYProgress } = useScroll();

  // Distance factor: 0 -> together, 1 -> far apart, 0 -> together (sin curve)
  const distance = useTransform(scrollYProgress, (v) => Math.sin(v * Math.PI));

  // Trigger explosion once when reaching ~bottom
  const [explode, setExplode] = useState(false);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (v > 0.985 && !explode) setExplode(true);
      if (v < 0.9 && explode) setExplode(false); // reset when user scrolls up
    });
    return () => unsub();
  }, [scrollYProgress, explode]);

  // Circle specs (size, color, angle)
  const circles: Circle[] = useMemo(
    () => [
      { size: 240, color: "rgba(16,185,129,0.25)", angle: 0 },
      { size: 200, color: "rgba(37,99,235,0.22)", angle: Math.PI / 3 },
      { size: 180, color: "rgba(139,92,246,0.22)", angle: (2 * Math.PI) / 3 },
      { size: 160, color: "rgba(245,158,11,0.22)", angle: Math.PI },
      { size: 220, color: "rgba(59,130,246,0.20)", angle: (4 * Math.PI) / 3 },
      { size: 140, color: "rgba(34,197,94,0.22)", angle: (5 * Math.PI) / 3 },
    ],
    []
  );

  const maxRadius = 320; // how far they drift from center

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Main cluster */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {circles.map((c, i) => {
          // position transforms based on scroll distance
          const x = useTransform(distance, (d) => Math.cos(c.angle) * d * maxRadius);
          const y = useTransform(distance, (d) => Math.sin(c.angle) * d * maxRadius);
          // subtle breathing scale with scroll
          const scale = useTransform(distance, (d) => 0.95 + d * 0.1);
          return (
            <motion.div
              key={i}
              style={{ x, y, scale }}
              className="absolute rounded-full blur-2xl"
              animate={{
                boxShadow: [
                  `0 0 120px ${c.color}`,
                  `0 0 160px ${c.color}`,
                  `0 0 120px ${c.color}`,
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                style={{ background: c.color, width: c.size, height: c.size }}
                className="rounded-full"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Merge cue: when close to bottom they overlap as one */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ opacity: useTransform(distance, (d) => (d < 0.15 ? 0.25 : 0)) }}
      >
        <div className="h-56 w-56 rounded-full" style={{ background: "rgba(16,185,129,0.18)" }} />
      </motion.div>

      {/* Explosion overlay */}
      <AnimatePresence>
        {explode && (
          <motion.div
            key="boom"
            initial={{ scale: 0.8, opacity: 0.35 }}
            animate={{ scale: 6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          >
            <div className="h-64 w-64 rounded-full bg-white/60" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft vignette edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
};

export default ScrollCircles;