"use client";

import { useRef } from "react";
import styles from "./marketing.module.css";

/**
 * The metal card, front and back, rendered from the real print artwork.
 * Tilts gently towards the pointer; static for touch and reduced motion.
 */
export function CardShowcase() {
  const tiltRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = tiltRef.current;
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
    el.style.setProperty("--sheen", `${x * 40}%`);
  }

  function onLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--sheen", "0%");
  }

  return (
    <div className={styles.showcase} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={tiltRef} className={styles.tilt} style={{ transform: "rotateY(-10deg) rotateX(6deg)" }}>
        <div
          className={`${styles.card} ${styles.cardBack}`}
          style={{ backgroundImage: "url(/cards/metal-back.png)" }}
          role="img"
          aria-label="Back of the Tapfolio metal card, with a QR code and tap instructions"
        />
        <div
          className={`${styles.card} ${styles.cardFront}`}
          style={{ backgroundImage: "url(/cards/metal-front.png)" }}
          role="img"
          aria-label="Front of the Tapfolio metal card in black steel with an engraved logo"
        />
      </div>
    </div>
  );
}
