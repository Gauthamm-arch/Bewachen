"use client";

import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { PanInfo, animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { shouldComplete } from "@/lib/sliderMath";
import { CheckIcon, ChevronRightIcon, SpinnerIcon } from "./icons";

type Variant = "primary" | "danger";
type Size = "lg" | "md" | "sm";

const SIZES: Record<Size, { track: number; knob: number; text: string }> = {
  lg: { track: 88, knob: 74, text: "text-lg" },
  md: { track: 82, knob: 68, text: "text-lg font-bold" },
  sm: { track: 72, knob: 58, text: "text-base font-bold" },
};
const BORDER = 2;
const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

const STYLES = {
  primary: { track: "border-slate-500/80 bg-bewachen-surface shadow-md", fill: "bg-blue-600", label: "text-slate-100", knob: "text-blue-600" },
  danger: { track: "border-red-500/60 bg-red-950/50 shadow-md", fill: "bg-red-600", label: "text-red-100", knob: "text-red-600" },
} as const;

type Props = {
  label: string;
  onComplete: () => Promise<void> | void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  busyLabel?: string;
};

// A horizontal "slide to confirm" control. Drag the white knob to the end to confirm.
// Uses simple pan handling (not framer-motion's built-in drag) so it behaves the same every time.
// Keyboard: focus the knob and press Enter, Space or the right arrow.
export default function SlideToConfirm({
  label,
  onComplete,
  variant = "primary",
  size = "lg",
  disabled = false,
  busyLabel = "Working…",
}: Props) {
  const { track, knob, text } = SIZES[size];
  const s = STYLES[variant];
  const inset = (track - BORDER * 2 - knob) / 2; // equal gap around the knob
  const reduceMotion = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const maxX = Math.max(0, width - knob - inset * 2);
  const maxRef = useRef(0);
  maxRef.current = maxX;

  const x = useMotionValue(0);
  const fillWidth = useTransform(x, (v) => v + knob + inset * 2);
  const labelOpacity = useTransform(x, (v) => Math.max(0, 1 - v / Math.max(maxRef.current * 0.5, 1)));

  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const running = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const complete = useCallback(async () => {
    if (running.current || disabled) return;
    running.current = true;
    setPhase("busy");
    await animate(x, maxRef.current, { duration: 0.12 });
    try {
      await onComplete();
      if (mounted.current) setPhase("done");
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.error("Slider action failed:", err); // the caller shows the message
    } finally {
      if (mounted.current) {
        setPhase("idle");
        await animate(x, 0, SPRING);
      }
      running.current = false;
    }
  }, [disabled, onComplete, x]);

  const idle = phase === "idle";
  const enabledRef = useRef(false);
  enabledRef.current = !disabled && idle;
  const startX = useRef(0);

  const onPanStart = () => {
    if (!enabledRef.current) return;
    x.stop();
    startX.current = x.get();
  };
  const onPan = (_: unknown, info: PanInfo) => {
    if (!enabledRef.current) return;
    x.set(Math.min(maxRef.current, Math.max(0, startX.current + info.offset.x)));
  };
  const onPanEnd = () => {
    if (!enabledRef.current || running.current) return;
    if (shouldComplete(x.get(), maxRef.current)) void complete();
    else animate(x, 0, SPRING);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
      e.preventDefault();
      void complete();
    }
  };

  return (
    <div
      ref={trackRef}
      aria-disabled={disabled}
      className={`relative w-full select-none overflow-hidden rounded-full border-2 ${s.track} ${disabled ? "opacity-40" : ""}`}
      style={{ height: track }}
    >
      {/* progress fill */}
      <motion.div className={`absolute inset-y-0 left-0 rounded-full ${s.fill}`} style={{ width: fillWidth }} />

      {/* resting label (fades as you slide) */}
      <motion.div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap font-bold ${text} ${s.label}`}
        style={{ opacity: labelOpacity, paddingLeft: knob + inset * 2 }}
      >
        {label}
      </motion.div>

      {/* status while working / done */}
      {!idle && (
        <div className={`pointer-events-none absolute inset-0 flex items-center justify-center font-bold text-white ${text}`} aria-live="polite">
          {phase === "busy" ? busyLabel : "Done"}
        </div>
      )}

      {/* the knob */}
      <motion.div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={idle ? 0 : 100}
        aria-valuetext={idle ? "Not confirmed" : "Confirmed"}
        aria-disabled={disabled}
        onKeyDown={onKeyDown}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        className={`absolute flex items-center justify-center rounded-full bg-white shadow-lg ${disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"} ${s.knob} focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white`}
        style={{ x, width: knob, height: knob, left: inset, top: inset, touchAction: "pan-y" }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full transition-transform active:scale-95">
          {phase === "busy" ? (
            <SpinnerIcon className="h-7 w-7 animate-spin" />
          ) : phase === "done" ? (
            <CheckIcon className="h-7 w-7" />
          ) : (
            <span className={`flex ${reduceMotion || disabled ? "" : "chev-nudge"}`}>
              <ChevronRightIcon className="h-8 w-8" />
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
