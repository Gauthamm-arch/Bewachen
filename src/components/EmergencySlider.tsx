"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { PanInfo, animate, motion, useMotionValue } from "framer-motion";
import { EmergencyService, SERVICE_LABELS } from "@/lib/emergencyNumbers";
import { nearestIndex, stationPositions } from "@/lib/sliderMath";
import { AmbulanceIcon, FlameIcon, PhoneIcon, ShieldIcon } from "./icons";

const STATIONS: EmergencyService[] = ["ambulance", "police", "fire"];
const ICONS = { ambulance: AmbulanceIcon, police: ShieldIcon, fire: FlameIcon };

const TRACK = 88;
const KNOB = 72;
const BORDER = 2;
const INSET = (TRACK - BORDER * 2 - KNOB) / 2;
const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

type Props = {
  numbers: Record<EmergencyService, string>;
  /** The service currently being called (dialer open). The knob returns home when this becomes null. */
  active: EmergencyService | null;
  onSelect: (service: EmergencyService) => void;
};

// Uses simple pan handling (not framer-motion's built-in drag) so it behaves the same every time.
// One slider, three snap points. Drag the red knob to Ambulance, Police or Fire and let go.
// Keyboard: focus the knob, use the left/right arrows to pick a service, then press Enter.
export default function EmergencySlider({ numbers, active, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const travel = Math.max(0, width - KNOB - INSET * 2);
  const positions = stationPositions(travel, STATIONS.length); // [home, s1, s2, s3]
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const x = useMotionValue(0);
  const busy = useRef(false);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const setIndex = (i: number) => { idxRef.current = i; setIdx(i); };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dialer closed -> knob goes home.
  useEffect(() => {
    if (active === null) {
      busy.current = false;
      setIndex(0);
      animate(x, 0, SPRING);
    }
  }, [active, x]);

  const trigger = async (i: number) => {
    if (i === 0 || busy.current) return;
    busy.current = true;
    setIndex(i);
    await animate(x, positionsRef.current[i], SPRING);
    onSelect(STATIONS[i - 1]);
  };

  const startX = useRef(0);
  const enabledRef = useRef(true);
  enabledRef.current = !active;

  const onPanStart = () => {
    if (!enabledRef.current || busy.current) return;
    x.stop();
    startX.current = x.get();
  };
  const onPan = (_: unknown, info: PanInfo) => {
    if (!enabledRef.current || busy.current) return;
    x.set(Math.min(positionsRef.current[STATIONS.length], Math.max(0, startX.current + info.offset.x)));
  };

  const handleDragEnd = () => {
    if (!enabledRef.current || busy.current) return;
    const i = nearestIndex(x.get(), positionsRef.current);
    if (i === 0) {
      setIndex(0);
      animate(x, 0, SPRING);
    } else {
      void trigger(i);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (busy.current) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = Math.min(STATIONS.length, Math.max(0, idxRef.current + (e.key === "ArrowRight" ? 1 : -1)));
      setIndex(next);
      animate(x, positionsRef.current[next], SPRING);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void trigger(idxRef.current);
    }
  };

  const centerOf = (i: number) => INSET + KNOB / 2 + positions[i + 1];
  const selectedLabel = idx === 0 ? "No service selected" : `${SERVICE_LABELS[STATIONS[idx - 1]]} selected. Press Enter to call`;

  return (
    <div>
      <div
        ref={trackRef}
        className="relative w-full select-none overflow-hidden rounded-full border-2 border-slate-600 bg-bewachen-dark"
        style={{ height: TRACK }}
      >
        {width > 0 && (
          <>
            <div className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-slate-700" style={{ left: INSET + KNOB / 2, width: travel }} />
            {STATIONS.map((s, i) => {
              const Icon = ICONS[s];
              return (
                <span key={s} className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-slate-200" style={{ left: centerOf(i) }}>
                  <Icon className="h-7 w-7" />
                </span>
              );
            })}
          </>
        )}

        <motion.div
          role="slider"
          tabIndex={0}
          aria-label="Emergency services"
          aria-valuemin={0}
          aria-valuemax={STATIONS.length}
          aria-valuenow={idx}
          aria-valuetext={selectedLabel}
          onKeyDown={onKeyDown}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={handleDragEnd}
          className="absolute z-10 flex cursor-grab items-center justify-center rounded-full bg-red-600 text-white shadow-lg active:cursor-grabbing focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ x, width: KNOB, height: KNOB, left: INSET, top: INSET, touchAction: "pan-y" }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full transition-transform active:scale-95">
            <PhoneIcon className="h-8 w-8" />
          </div>
        </motion.div>
      </div>

      {/* labels under each stop */}
      <div className="relative mt-3 h-[52px]" aria-hidden="true">
        {width > 0 &&
          STATIONS.map((s, i) => (
            <div key={s} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: BORDER + centerOf(i) }}>
              <div className="text-[13px] font-bold leading-tight text-slate-100 min-[360px]:text-[15px]">{SERVICE_LABELS[s]}</div>
              <div className="text-sm tabular-nums text-slate-400">{numbers[s]}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
