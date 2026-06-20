"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Position = { x: number; y: number };

type MovableModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
};

const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function MovableModal({
  open,
  title,
  children,
  onClose,
  initialWidth = 900,
  initialHeight = 560,
  minWidth = 460,
  minHeight = 280,
}: MovableModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origin: Position } | null>(null);
  const [position, setPosition] = useState<Position>({ x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN });

  const centerInViewport = useCallback(() => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth || initialWidth;
    const height = panel?.offsetHeight || initialHeight;
    const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
    setPosition({
      x: clamp((window.innerWidth - width) / 2, VIEWPORT_MARGIN, maxX),
      y: clamp((window.innerHeight - height) / 2, VIEWPORT_MARGIN, maxY),
    });
  }, [initialHeight, initialWidth]);

  useEffect(() => {
    if (!open) return;
    const rafId = window.requestAnimationFrame(centerInViewport);
    return () => window.cancelAnimationFrame(rafId);
  }, [centerInViewport, open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
      const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
      setPosition((prev) => ({
        x: clamp(prev.x, VIEWPORT_MARGIN, maxX),
        y: clamp(prev.y, VIEWPORT_MARGIN, maxY),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const activeDrag = dragRef.current;
      const panel = panelRef.current;
      if (!activeDrag || !panel) return;
      if (event.pointerId !== activeDrag.pointerId) return;

      const dx = event.clientX - activeDrag.startX;
      const dy = event.clientY - activeDrag.startY;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
      const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

      setPosition({
        x: clamp(activeDrag.origin.x + dx, VIEWPORT_MARGIN, maxX),
        y: clamp(activeDrag.origin.y + dy, VIEWPORT_MARGIN, maxY),
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragRef.current && event.pointerId === dragRef.current.pointerId) {
        dragRef.current = null;
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.userSelect = "";
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute ys-modal-panel shadow-xl"
        style={{
          left: position.x,
          top: position.y,
          width: initialWidth,
          height: initialHeight,
          minWidth,
          minHeight,
          maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
          maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
          resize: "both",
          overflow: "auto",
        }}
      >
        <div
          className="sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex cursor-move items-start justify-between gap-4 border-b border-border bg-card px-5 py-4"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              origin: position,
            };
            document.body.style.userSelect = "none";
          }}
        >
          <div className="text-lg font-semibold text-foreground">{title}</div>
          <button type="button" onClick={onClose} className="ys-icon-btn" aria-label="Close" data-modal-close>
            <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
