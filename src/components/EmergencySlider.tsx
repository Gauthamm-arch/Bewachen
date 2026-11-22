"use client";

import { KeyboardEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmergencyService, SERVICE_LABELS } from "@/lib/emergencyNumbers";
import { nearestIndex, stationPositions } from "@/lib/sliderMath";
import { AmbulanceIcon, FlameIcon, PhoneIcon, ShieldIcon } from "./icons";

const STATIONS: EmergencyService[] = ["ambulance", "police", "fire"];
const ICONS = { ambulance: AmbulanceIcon, police: ShieldIcon, fire: FlameIcon };

const THICKNESS = 88;
const KNOB = 72;
const BORDER = 2;
const INSET = (THICKNESS - BORDER * 2 - KNOB) / 2;
const SNAP_MS = 120; // knob slides the last bit onto the chosen service
const HOME_MS = 260; // knob glides back home
const RETURN_DELAY_MS = 500; // after the call starts

type Props = {
  numbers: Record<EmergencyService, string>;
  /** The service currently being called (dialer open). The knob also returns home when this becomes null. */
  active: EmergencyService | null;
  onSelect: (service: EmergencyService) => void;
};

function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const update = () => setIsLandscape(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isLandscape;
}

const setSliding = (on: boolean) => {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute("data-sliding", "1");
  else document.documentElement.removeAttribute("data-sliding");
};

// Emergency Slider:
// - Landscape: vertical track sliding bottom-to-top towards Ambulance, Police, Fire.
// - Portrait: horizontal track sliding left-to-right towards Ambulance, Police, Fire.
//
// Smoothness: the knob is moved with a plain CSS transform (translate3d) written straight to the element
// once per animation frame. No framer-motion, no React re-render and no overflow clipping while dragging,
// and every other looping animation on the page is paused (data-sliding, see globals.css) until you let go.
export default function EmergencySlider({ numbers, active, onSelect }: Props) {
  const isLandscape = useIsLandscape();
  const isLandscapeRef = useRef(isLandscape);
  isLandscapeRef.current = isLandscape;

  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [trackDim, setTrackDim] = useState(380); // height if landscape, width if portrait
  const travel = Math.max(0, trackDim - KNOB - INSET * 2);
  const positions = useMemo(() => stationPositions(travel, STATIONS.length), [travel]);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const busy = useRef(false);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const setIndex = useCallback((i: number) => {
    idxRef.current = i;
    setIdx(i);
  }, []);

  // Knob offset in px, signed: landscape goes negative (up), portrait goes positive (right).
  const posRef = useRef(0);
  const nextPos = useRef(0);
  const raf = useRef<number | null>(null);
  const drag = useRef<{ id: number; startPointer: number; startValue: number } | null>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(true);
  enabledRef.current = !active;

  const writePos = useCallback((v: number, ms = 0) => {
    posRef.current = v;
    const el = knobRef.current;
    if (!el) return;
    el.style.transition = ms > 0 ? `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none";
    el.style.transform = isLandscapeRef.current ? `translate3d(0, ${v}px, 0)` : `translate3d(${v}px, 0, 0)`;
  }, []);

  const cancelRaf = () => {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  // Put the knob back at its starting position. Safe to call any time.
  const goHome = useCallback(
    (immediate = false) => {
      if (returnTimer.current) {
        clearTimeout(returnTimer.current);
        returnTimer.current = null;
      }
      cancelRaf();
      busy.current = false;
      drag.current = null;
      setSliding(false);
      setIndex(0);
      writePos(0, immediate ? 0 : HOME_MS);
    },
    [setIndex, writePos]
  );

  useEffect(
    () => () => {
      if (returnTimer.current) clearTimeout(returnTimer.current);
      if (selectTimer.current) clearTimeout(selectTimer.current);
      cancelRaf();
      setSliding(false);
    },
    []
  );

  // Measure the track.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const val = isLandscape
        ? (el.clientHeight || el.offsetHeight || el.getBoundingClientRect().height)
        : (el.clientWidth || el.offsetWidth || el.getBoundingClientRect().width);
      if (val > 0) setTrackDim((prev) => (Math.abs(prev - val) > 1 ? val : prev));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLandscape]);

  // Dialer closed (or the page's "calling" state ended): knob goes home.
  useEffect(() => {
    if (active === null) goHome();
  }, [active, goHome]);

  // Orientation changed: the knob's axis changed, so snap it home.
  useEffect(() => {
    goHome(true);
  }, [isLandscape, goHome]);

  // Coming back from the phone app / another tab / bfcache: snap home.
  useEffect(() => {
    const snapIfNeeded = () => {
      if (document.visibilityState === "hidden" || drag.current) return;
      if (posRef.current !== 0 || idxRef.current !== 0 || busy.current) goHome(true);
    };
    document.addEventListener("visibilitychange", snapIfNeeded);
    window.addEventListener("pageshow", snapIfNeeded);
    window.addEventListener("focus", snapIfNeeded);
    return () => {
      document.removeEventListener("visibilitychange", snapIfNeeded);
      window.removeEventListener("pageshow", snapIfNeeded);
      window.removeEventListener("focus", snapIfNeeded);
    };
  }, [goHome]);

  const trigger = (i: number) => {
    if (i === 0 || busy.current) return;
    busy.current = true;
    setSliding(false);
    setIndex(i);
    const target = isLandscapeRef.current ? -positionsRef.current[i] : positionsRef.current[i];
    writePos(target, SNAP_MS);
    if (selectTimer.current) clearTimeout(selectTimer.current);
    selectTimer.current = setTimeout(() => {
      onSelectRef.current(STATIONS[i - 1]);
      // Don't wait for the parent: bring the knob home shortly after the call starts.
      if (returnTimer.current) clearTimeout(returnTimer.current);
      returnTimer.current = setTimeout(() => goHome(), RETURN_DELAY_MS);
    }, SNAP_MS + 10);
  };

  const coord = (e: ReactPointerEvent<HTMLDivElement>) => (isLandscapeRef.current ? e.clientY : e.clientX);

  // Where the knob really is right now (correct even if it is mid-glide).
  const currentPos = () => {
    const el = knobRef.current;
    if (!el) return posRef.current;
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return isLandscapeRef.current ? m.m42 : m.m41;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current || busy.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const start = currentPos();
    writePos(start, 0);
    nextPos.current = start;
    drag.current = { id: e.pointerId, startPointer: coord(e), startValue: start };
    setSliding(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || busy.current) return;
    const max = positionsRef.current[STATIONS.length];
    const raw = d.startValue + (coord(e) - d.startPointer);
    nextPos.current = isLandscapeRef.current ? Math.max(-max, Math.min(0, raw)) : Math.max(0, Math.min(max, raw));
    if (raf.current == null) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        writePos(nextPos.current, 0);
      });
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    cancelRaf();
    setSliding(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (busy.current) return;
    writePos(nextPos.current, 0);
    const dist = isLandscapeRef.current ? -nextPos.current : nextPos.current;
    const i = cancelled ? 0 : nearestIndex(dist, positionsRef.current);
    if (i === 0) goHome();
    else trigger(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (busy.current) return;
    const forwardKey = isLandscape ? "ArrowUp" : "ArrowRight";
    const backKey = isLandscape ? "ArrowDown" : "ArrowLeft";

    if (e.key === forwardKey || e.key === backKey) {
      e.preventDefault();
      const next = Math.min(STATIONS.length, Math.max(0, idxRef.current + (e.key === forwardKey ? 1 : -1)));
      setIndex(next);
      writePos(isLandscape ? -positionsRef.current[next] : positionsRef.current[next], 180);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trigger(idxRef.current);
    }
  };

  const knobHandlers = {
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => endDrag(e, false),
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => endDrag(e, true),
  };

  const centerFromOrigin = (i: number) => INSET + KNOB / 2 + positions[i + 1];
  const selectedLabel = idx === 0 ? "No service selected" : `${SERVICE_LABELS[STATIONS[idx - 1]]} selected. Press Enter to call`;

  const knobClass =
    "absolute z-10 flex cursor-grab items-center justify-center rounded-full bg-red-600 text-white shadow-md active:cursor-grabbing focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white";

  const knobInner = (
    <>
      {idx === 0 && <span className="knob-ring pointer-events-none absolute inset-0 rounded-full bg-red-500/50" />}
      <div className="relative flex h-full w-full items-center justify-center rounded-full pointer-events-none">
        <PhoneIcon className="h-8 w-8" />
      </div>
    </>
  );

  // LANDSCAPE LAYOUT (Vertical track: bottom-to-top)
  if (isLandscape) {
    return (
      <div className="flex w-full items-center justify-center gap-7 py-1">
        {/* Vertical Track */}
        <div
          ref={trackRef}
          className="relative h-[360px] sm:h-[400px] shrink-0 select-none rounded-full border-2 border-slate-600 bg-bewachen-dark"
          style={{ width: THICKNESS }}
        >
          {trackDim > 0 && (
            <>
              {/* Vertical Center rail */}
              <div
                className="absolute left-1/2 w-0.5 -translate-x-1/2 rounded bg-slate-700"
                style={{ bottom: INSET + KNOB / 2, height: travel }}
              />
              {/* Target Station Icons */}
              {STATIONS.map((s, i) => {
                const Icon = ICONS[s];
                return (
                  <span
                    key={s}
                    className="pointer-events-none absolute left-1/2 z-0 flex h-10 w-10 -translate-x-1/2 translate-y-1/2 items-center justify-center text-slate-100"
                    style={{ bottom: centerFromOrigin(i) }}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                );
              })}
            </>
          )}

          {/* Sliding Phone Knob (bottom to top) */}
          <div
            ref={knobRef}
            role="slider"
            tabIndex={0}
            aria-label="Emergency services"
            aria-valuemin={0}
            aria-valuemax={STATIONS.length}
            aria-valuenow={idx}
            aria-valuetext={selectedLabel}
            {...knobHandlers}
            className={knobClass}
            style={{ width: KNOB, height: KNOB, left: INSET, bottom: INSET, touchAction: "none", willChange: "transform" }}
          >
            {knobInner}
          </div>
        </div>

        {/* Vertical Labels */}
        <div className="relative h-[360px] sm:h-[400px] flex-1 max-w-[200px]" aria-hidden="true">
          {trackDim > 0 &&
            STATIONS.map((s, i) => (
              <div
                key={s}
                className="absolute translate-y-1/2 text-left"
                style={{ bottom: BORDER + centerFromOrigin(i) }}
              >
                <div className="text-base font-bold leading-tight text-slate-100">{SERVICE_LABELS[s]}</div>
                <div className="text-sm tabular-nums text-slate-400">{numbers[s]}</div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // PORTRAIT LAYOUT (Horizontal track: left-to-right)
  return (
    <div className="w-full">
      {/* Horizontal Track */}
      <div
        ref={trackRef}
        className="relative w-full select-none rounded-full border-2 border-slate-600 bg-bewachen-dark"
        style={{ height: THICKNESS }}
      >
        {trackDim > 0 && (
          <>
            {/* Horizontal Center rail */}
            <div
              className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-slate-700"
              style={{ left: INSET + KNOB / 2, width: travel }}
            />
            {/* Target Station Icons */}
            {STATIONS.map((s, i) => {
              const Icon = ICONS[s];
              return (
                <span
                  key={s}
                  className="pointer-events-none absolute top-1/2 z-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-slate-100"
                  style={{ left: centerFromOrigin(i) }}
                >
                  <Icon className="h-7 w-7" />
                </span>
              );
            })}
          </>
        )}

        {/* Sliding Phone Knob (left to right) */}
        <div
          ref={knobRef}
          role="slider"
          tabIndex={0}
          aria-label="Emergency services"
          aria-valuemin={0}
          aria-valuemax={STATIONS.length}
          aria-valuenow={idx}
          aria-valuetext={selectedLabel}
          {...knobHandlers}
          className={knobClass}
          style={{ width: KNOB, height: KNOB, left: INSET, top: INSET, touchAction: "none", willChange: "transform" }}
        >
          {knobInner}
        </div>
      </div>

      {/* Horizontal Labels underneath track stops */}
      <div className="relative mt-3 h-[52px]" aria-hidden="true">
        {trackDim > 0 &&
          STATIONS.map((s, i) => (
            <div
              key={s}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: BORDER + centerFromOrigin(i) }}
            >
              <div className="text-[14px] font-bold leading-tight text-slate-100">{SERVICE_LABELS[s]}</div>
              <div className="text-sm tabular-nums text-slate-400">{numbers[s]}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
