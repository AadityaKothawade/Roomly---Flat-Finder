"use client";

import { useState } from "react";

// The signature visual of the app: a hand-drawn-feeling radial meter for the
// AI compatibility score, with the LLM's explanation revealed on click.
// Color communicates fit at a glance; the explanation is the "why".
export default function CompatibilityMeter({ score, explanation, source, static: isStatic = false }) {
  const [open, setOpen] = useState(false);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 75 ? "#3F6B4E" : score >= 45 ? "#B08D57" : "#B5583A";
  const label = score >= 75 ? "Strong match" : score >= 45 ? "Fair match" : "Weak match";

  const Wrapper = isStatic ? "div" : "button";

  return (
    <div className="inline-block">
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
        className="flex items-center gap-3 text-left group"
        aria-expanded={isStatic ? undefined : open}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#EDE6D6" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
          <text x="40" y="37" textAnchor="middle" fontSize="20" fontWeight="600" fill="#12213A" fontFamily="Fraunces, serif">
            {score}
          </text>
          <text x="40" y="52" textAnchor="middle" fontSize="9" fill="#12213A" opacity="0.6">
            / 100
          </text>
        </svg>
        <div>
          <div className="font-display text-sm font-medium" style={{ color }}>
            {label}
          </div>
          {!isStatic && (
            <div className="text-xs text-ink/60 underline decoration-dotted group-hover:text-ink">
              {open ? "hide reasoning" : "why this score?"}
            </div>
          )}
          {source === "fallback" && (
            <div className="text-[10px] text-brass mt-0.5">estimated (AI unavailable)</div>
          )}
        </div>
      </Wrapper>

      {!isStatic && open && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink/80 bg-linen border border-brass/30 rounded-card p-3">
          {explanation}
        </p>
      )}
    </div>
  );
}
