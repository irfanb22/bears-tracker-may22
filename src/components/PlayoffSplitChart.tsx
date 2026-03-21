export default function PlayoffSplitChart() {
  return (
    <div className="w-full max-w-md py-6">
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">The closest call</p>
      <h3 className="mb-6 text-lg font-semibold text-bears-navy">
        Will the Bears make the playoffs?
      </h3>

      <div className="mb-5 text-center">
        <span className="text-5xl font-semibold text-bears-orange sm:text-6xl">54%</span>
        <p className="mt-1 text-sm text-slate-500">of fans correctly predicted yes</p>
      </div>

      <div className="mb-3 flex h-8 overflow-hidden rounded-md">
        <div
          className="flex items-center justify-center"
          style={{ width: '54%', backgroundColor: '#C83803' }}
        >
          <span className="text-xs font-medium text-orange-50">Yes 54%</span>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ width: '46%', backgroundColor: '#0B162A' }}
        >
          <span className="text-xs font-medium text-slate-100">No 46%</span>
        </div>
      </div>

      <p className="mb-2 text-sm font-medium text-bears-navy">Confidence breakdown</p>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Low', pct: 27, bg: 'bg-slate-100' },
          { label: 'Medium', pct: 35, bg: 'bg-orange-50' },
          { label: 'High', pct: 38, bg: 'bg-slate-200' }
        ].map((c) => (
          <div key={c.label} className={`flex-1 rounded-lg p-2.5 text-center ${c.bg}`}>
            <p className="mb-0.5 text-xs text-slate-500">{c.label}</p>
            <p className="text-lg font-medium text-bears-navy">{c.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
