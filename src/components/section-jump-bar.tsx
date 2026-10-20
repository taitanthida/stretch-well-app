import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type JumpItem = { id: string; label: string };

/**
 * Sticky row of chips that scroll to a section of the current screen and highlight
 * the section being read. Targets need an `id` and a `scroll-mt-*` class so they
 * stop below this bar. Targets that are missing or `display: none` are ignored.
 */
export function SectionJumpBar({ items, label = "Jump to section" }: { items: JumpItem[]; label?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const idsKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    const ids = idsKey ? idsKey.split("|") : [];
    let frame = 0;

    const update = () => {
      frame = 0;
      const visible = ids
        .map((id) => ({ id, el: document.getElementById(id) }))
        .filter((entry): entry is { id: string; el: HTMLElement } => Boolean(entry.el) && entry.el!.offsetParent !== null);

      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && visible.length > 0 && window.scrollY > 0) {
        setActiveId(visible[visible.length - 1]!.id);
        return;
      }

      // Active = the section whose top is closest to (but not below) the reading line under the bar.
      let best: { id: string; top: number } | null = null;
      for (const { id, el } of visible) {
        const top = el.getBoundingClientRect().top;
        if (top <= 120 && (!best || top > best.top)) best = { id, top };
      }
      setActiveId(best?.id ?? visible[0]?.id ?? null);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [idsKey]);

  // Keep the active chip visible when the bar itself scrolls sideways (small screens).
  useEffect(() => {
    const scroller = scrollerRef.current;
    const chip = activeId ? chipRefs.current[activeId] : null;
    if (!scroller || !chip) return;
    scroller.scrollTo({ left: chip.offsetLeft - scroller.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [activeId]);

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div
        ref={scrollerRef}
        className="relative mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(node) => {
                chipRefs.current[item.id] = node;
              }}
              type="button"
              onClick={() => jump(item.id)}
              aria-current={active ? "location" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-soft text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
