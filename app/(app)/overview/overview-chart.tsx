"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export function OverviewChart() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  return (
    <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Leads found vs. revealed</h2>
          {/* Legend */}
          <div className="mt-1 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Found</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-400" />
              <span className="text-muted-foreground">Revealed</span>
            </div>
          </div>
        </div>

        {/* Period Switcher */}
        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              period === "week"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              period === "month"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setPeriod("quarter")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              period === "quarter"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* SVG Chart Visualization */}
      <div className="relative mt-6 h-56 w-full">
        {/* Ligne moyenne Avg 214 */}
        <div className="absolute top-[48%] left-0 right-0 z-0 flex items-center border-b border-dashed border-border/80">
          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
            Avg 214
          </span>
        </div>

        {/* Tooltip Aug 12, 2026 */}
        <div className="absolute top-[22%] left-[68%] z-10 -translate-x-1/2 rounded-xl border border-border bg-card/95 px-2.5 py-1 text-center shadow-md backdrop-blur-xs">
          <p className="text-[11px] font-bold text-foreground">312 leads</p>
          <p className="text-[9px] text-muted-foreground">Aug 12, 2026</p>
          <div className="mx-auto mt-0.5 size-1.5 rounded-full bg-orange-500 ring-2 ring-background" />
        </div>

        <svg
          viewBox="0 0 600 200"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="foundGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="revealedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curves */}
          <path
            d="M 0,140 Q 60,110 120,130 T 240,110 T 360,150 T 480,80 T 600,120 L 600,200 L 0,200 Z"
            fill="url(#foundGradient)"
          />

          {/* Courbe Found (Orange) */}
          <path
            d="M 0,140 Q 60,110 120,130 T 240,110 T 360,150 T 480,80 T 600,120"
            fill="none"
            stroke="#F97316"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Courbe Revealed (Indigo / Lavender) */}
          <path
            d="M 0,170 Q 60,150 120,165 T 240,145 T 360,175 T 480,125 T 600,140"
            fill="none"
            stroke="#818CF8"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Highlighted point on orange curve */}
          <circle cx="410" cy="98" r="4.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
        </svg>

        {/* X Axis Month Labels */}
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground/80 px-1">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
            <span
              key={m}
              className={`rounded-md px-1.5 py-0.5 transition-colors ${
                m === "Aug"
                  ? "bg-orange-500/15 font-bold text-orange-600 dark:text-orange-400"
                  : ""
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

