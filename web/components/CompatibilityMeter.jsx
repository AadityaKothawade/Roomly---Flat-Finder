"use client";

import { useState } from "react";

export default function CompatibilityMeter({
  score,
  explanation,
  source,
  static: isStatic = false,
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  const size = compact ? 56 : 80;
  const radius = compact ? 22 : 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const color =
    score >= 75
      ? "rgb(var(--color-moss))"
      : score >= 45
        ? "rgb(var(--color-brass))"
        : "rgb(var(--color-clay))";
  const label = score >= 75 ? "Strong" : score >= 45 ? "Fair" : "Weak";

  const Wrapper = isStatic ? "div" : "button";

  return (
    <div className="inline-block shrink-0">
      <Wrapper
        onClick={
          isStatic
            ? undefined
            : (e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((o) => !o);
              }
        }
        className="flex items-center gap-2.5 text-left group"
        aria-expanded={isStatic ? undefined : open}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgb(var(--color-linen))"
            strokeWidth={compact ? 6 : 8}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={compact ? 6 : 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
          <text
            x={center}
            y={compact ? center - 1 : center - 2}
            textAnchor="middle"
            fontSize={compact ? 14 : 20}
            fontWeight="600"
            fill="rgb(var(--color-ink))"
            fontFamily="Fraunces, serif"
          >
            {score}
          </text>
          {!compact && (
            <text x={center} y={center + 14} textAnchor="middle" fontSize="9" fill="rgb(var(--color-ink))" opacity="0.5">
              / 100
            </text>
          )}
        </svg>
        {!compact && (
          <div>
            <div className="font-display text-sm font-medium" style={{ color }}>
              {label} match
            </div>
            {!isStatic && (
              <div className="text-xs text-ink/50 underline decoration-dotted group-hover:text-ink">
                {open ? "hide" : "why?"}
              </div>
            )}
            {source === "fallback" && (
              <div className="text-[10px] text-brass mt-0.5">estimated</div>
            )}
          </div>
        )}
      </Wrapper>

      {!isStatic && open && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/75 card p-3 border-brass/20">
          {explanation}
        </p>
      )}
    </div>
  );
}
