"use client";

import { useEffect, useRef, useState } from "react";
import { SECTION_ORDER } from "./sections";
import ds from "./dashboard.module.css";

/**
 * A sticky row of links to each section, so a long page is quick to get around
 * on a phone. Plain anchor links (they work without JavaScript); the script only
 * highlights the section you're in and keeps that link in view.
 */
export function JumpNav() {
  const [active, setActive] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onScreen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target.id);
          else onScreen.delete(e.target.id);
        }
        const first = SECTION_ORDER.find((s) => onScreen.has(s.id));
        if (first) setActive(first.id);
      },
      // A band just below the sticky header and menu.
      { rootMargin: "-150px 0px -55% 0px" },
    );
    for (const s of SECTION_ORDER) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ul = list.current;
    const link = active ? ul?.querySelector<HTMLElement>(`[href="#${active}"]`) : null;
    if (!ul || !link) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollTo({
      left: link.offsetLeft - (ul.clientWidth - link.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <nav className={ds.jump} aria-label="Jump to a section">
      <ul className={ds.jumpList} ref={list}>
        {SECTION_ORDER.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
