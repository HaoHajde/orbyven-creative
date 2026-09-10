"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type AvailabilityState = "loading" | "ready" | "error";

type AvailabilityResponse = {
  configured?: boolean;
  busyDates?: string[];
};

type Props = {
  selectedDate: string;
  onSelect: (date: string) => void;
};

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function dateFromKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
}

export default function LiveAvailabilityCalendar({ selectedDate, onSelect }: Props) {
  const initialSelected = dateFromKey(selectedDate);
  const [cursor, setCursor] = useState(() => {
    const base = initialSelected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [state, setState] = useState<AvailabilityState>("loading");

  const key = useMemo(() => monthKey(cursor), [cursor]);
  const today = useMemo(() => localDateKey(new Date()), []);
  const busySet = useMemo(() => new Set(busyDates), [busyDates]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/public/obsidian-availability?month=${key}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as AvailabilityResponse;
        if (!response.ok || payload.configured === false) throw new Error("availability_unavailable");
        return payload;
      })
      .then((payload) => {
        setBusyDates(Array.isArray(payload.busyDates) ? payload.busyDates : []);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBusyDates([]);
        setState("error");
      });

    return () => controller.abort();
  }, [key]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekDay + 1;
    return day >= 1 && day <= totalDays ? day : null;
  });

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  const canGoBack = cursor.getTime() > currentMonth.getTime();

  const selectedBusy = Boolean(selectedDate && busySet.has(selectedDate));
  const selectedInThisMonth = selectedDate.startsWith(`${key}-`);

  const changeMonth = (direction: -1 | 1) => {
    if (direction === -1 && !canGoBack) return;
    setState("loading");
    setBusyDates([]);
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const monthLabel = new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#d8b438]/14 bg-black/30">
      <div className="flex items-center justify-between border-b border-[#d8b438]/10 px-4 py-4 sm:px-5">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#d8b438]/62">Calendar live</p>
          <p className="mt-1 text-[18px] font-semibold capitalize tracking-[-0.035em]">{monthLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={!canGoBack}
            aria-label="Luna precedentă"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-[18px] text-white/55 transition hover:border-[#d8b438]/25 hover:text-[#e7cc6b] disabled:cursor-not-allowed disabled:opacity-20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Luna următoare"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-[18px] text-white/55 transition hover:border-[#d8b438]/25 hover:text-[#e7cc6b]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day, index) => (
            <div key={`${day}-${index}`} className="pb-2 text-center text-[7px] font-bold uppercase tracking-[0.12em] text-white/24">
              {day}
            </div>
          ))}

          {cells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="aspect-square" />;

            const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
            const past = iso < today;
            const busy = state === "ready" && busySet.has(iso);
            const selected = selectedDate === iso;

            return (
              <motion.button
                key={iso}
                type="button"
                disabled={past}
                onClick={() => onSelect(iso)}
                whileTap={past ? undefined : { scale: 0.93 }}
                className={`relative aspect-square rounded-[12px] border text-[10px] font-semibold transition sm:rounded-[14px] sm:text-[11px] ${
                  selected
                    ? busy
                      ? "border-white/24 bg-white/[0.07] text-white"
                      : "border-[#d8b438]/65 bg-[#d8b438] text-[#111] shadow-[0_10px_26px_rgba(216,180,56,.16)]"
                    : past
                      ? "border-transparent text-white/10"
                      : busy
                        ? "border-white/[0.05] bg-white/[0.018] text-white/24"
                        : "border-white/[0.055] bg-white/[0.02] text-white/66 hover:border-[#d8b438]/28 hover:text-[#ecd577]"
                }`}
              >
                {day}
                {state === "ready" && !past && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      busy ? "bg-white/18" : selected ? "bg-[#111]/45" : "bg-[#d8b438]/70"
                    }`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.06] bg-white/[0.018] px-4 py-3.5">
          {state === "loading" && (
            <div className="flex items-center gap-3">
              <motion.span
                className="h-2 w-2 rounded-full bg-[#d8b438]"
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <p className="text-[10px] text-white/52">Sincronizăm calendarul firmei…</p>
            </div>
          )}

          {state === "error" && (
            <div>
              <p className="text-[10px] font-semibold text-white/68">Calendarul live nu răspunde momentan.</p>
              <p className="mt-1 text-[8px] leading-4 text-white/30">Poți selecta data și trimite cererea direct echipei.</p>
            </div>
          )}

          {state === "ready" && !selectedInThisMonth && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold text-white/64">Alege o zi.</p>
                <p className="mt-1 text-[8px] text-white/28">Punct auriu = liberă acum.</p>
              </div>
              <span className="rounded-full border border-[#d8b438]/16 bg-[#d8b438]/[0.05] px-3 py-2 text-[7px] font-bold uppercase tracking-[0.14em] text-[#d8b438]">LIVE</span>
            </div>
          )}

          {state === "ready" && selectedInThisMonth && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-[11px] font-semibold ${selectedBusy ? "text-white/58" : "text-[#efd570]"}`}>
                  {selectedBusy ? "Data este ocupată în calendar." : "Data este liberă acum."}
                </p>
                <p className="mt-1 text-[8px] leading-4 text-white/30">
                  {selectedBusy
                    ? "Poți alege altă zi sau întreba echipa despre alternative."
                    : "Nu există acum o rezervare blocantă pentru această zi."}
                </p>
              </div>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${selectedBusy ? "bg-white/20" : "bg-[#d8b438] shadow-[0_0_18px_rgba(216,180,56,.7)]"}`} />
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[7px] text-white/26">
          <span className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-[#d8b438]" /> disponibilă</span>
          <span className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-white/18" /> ocupată</span>
          <span>Confirmarea finală rămâne la echipă.</span>
        </div>
      </div>
    </div>
  );
}
