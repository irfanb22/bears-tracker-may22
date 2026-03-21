const predictions = [
  { label: 'Caleb breaks passing record', pct: 90 },
  { label: 'Top-10 defense (no)', pct: 87 },
  { label: 'Ben Johnson COY finalist', pct: 79 },
  { label: 'Bears win 8+ games', pct: 72 },
  { label: 'Joe Thuney Pro Bowl', pct: 68 },
  { label: 'Caleb starts all 17', pct: 58 },
  { label: 'Bears make playoffs', pct: 54 },
  { label: 'Caleb throws 30 TDs (no)', pct: 41 },
  { label: 'Top-10 offense', pct: 40 },
  { label: 'Brisker starts 15 games', pct: 35 },
  { label: 'Sweat 10+ sacks (no)', pct: 27 },
  { label: 'Odunze 1,000 yards (no)', pct: 22 },
  { label: '1st round pick', pct: 21 }
];

export default function AccuracyChart() {
  return (
    <div className="w-full max-w-2xl py-6">
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
        Bears prediction tracker
      </p>
      <h3 className="mb-6 text-lg font-semibold text-bears-navy">
        How accurate were Bears fans across all 13 predictions?
      </h3>

      <div className="flex flex-col gap-2.5">
        {predictions.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-48 min-w-[192px] text-right text-sm text-slate-700">{d.label}</div>
            <div className="h-6 flex-1 overflow-hidden rounded bg-slate-200">
              <div
                className="h-full rounded-l bg-bears-navy transition-all duration-500"
                style={{
                  width: `${d.pct}%`,
                  borderRadius: d.pct === 100 ? '4px' : '4px 0 0 4px'
                }}
              />
            </div>
            <div className="min-w-[36px] text-sm font-semibold text-bears-orange">{d.pct}%</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-bears-navy" />
          Correct %
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
          Incorrect %
        </span>
      </div>
    </div>
  );
}
