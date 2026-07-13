export default function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute -inset-4 bg-gradient-to-b from-moss/20 via-brass/10 to-transparent rounded-2xl blur-2xl opacity-60" aria-hidden="true" />
      <div className="relative rounded-xl border border-ink/10 bg-parchment shadow-2xl shadow-ink/10 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-ink/10 bg-linen/80">
          <span className="w-2.5 h-2.5 rounded-full bg-clay/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-brass/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-moss/70" />
          <span className="ml-3 text-xs text-ink/40 font-medium">roomly.app/listings</span>
        </div>

        {/* Mock app UI */}
        <div className="p-5 md:p-6 bg-gradient-to-br from-parchment to-linen/60">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-ink/40 uppercase tracking-wide">Browse rooms</p>
              <p className="font-display text-lg text-ink">Ranked by your fit</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-moss/15 text-moss font-medium">AI scored</span>
          </div>

          <div className="space-y-3">
            <PreviewListing
              title="Sunny room near the park"
              location="Koramangala"
              rent="18,000"
              score={94}
              highlight
            />
            <PreviewListing title="Quiet private room" location="Indiranagar" rent="22,000" score={81} />
            <PreviewListing title="Shared flat — great flatmates" location="HSR Layout" rent="14,500" score={72} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewListing({ title, location, rent, score, highlight }) {
  const color = score >= 85 ? "text-moss" : score >= 70 ? "text-brass" : "text-ink/60";
  const ring = score >= 85 ? "border-moss/40" : "border-ink/10";

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-lg border bg-parchment/80 ${ring} ${
        highlight ? "ring-1 ring-moss/20" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="font-medium text-sm text-ink truncate">{title}</p>
        <p className="text-xs text-ink/50 mt-0.5">
          {location} · ₹{rent}/mo
        </p>
      </div>
      <div className={`shrink-0 ml-3 text-center ${color}`}>
        <div className="font-display text-xl leading-none">{score}</div>
        <div className="text-[10px] uppercase tracking-wide opacity-70">match</div>
      </div>
    </div>
  );
}
