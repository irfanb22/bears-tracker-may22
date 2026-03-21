const choices = [
  { label: 'Ashton Jeanty (RB, Boise State)', pct: 35, color: '#0B162A' },
  { label: 'Tyler Warren (TE, Penn State)', pct: 28, color: '#C83803' },
  { label: 'Other (correct)', pct: 21, color: '#1D4ED8' },
  { label: 'Kelvin Banks (Tackle, Texas)', pct: 10, color: '#F97316' },
  { label: 'Will Campbell (Tackle, LSU)', pct: 3, color: '#334155' },
  { label: 'Mason Graham (DT, Michigan)', pct: 3, color: '#FB923C' },
  { label: 'Armand Membou (OT, Missouri)', pct: 0, color: '#CBD5E1' }
];

export default function DraftPickChart() {
  return (
    <div className="w-full max-w-sm py-4 sm:max-w-md sm:py-6">
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">The hardest prediction</p>
      <h3 className="mb-2 text-base font-semibold text-bears-navy sm:text-lg">
        Who will the Bears select in the 1st round?
      </h3>
      <p className="mb-6 text-sm text-slate-500">Correct answer: Colston Loveland (not listed)</p>

      <div className="mx-auto flex max-w-sm flex-col gap-1.5">
        {choices.map((c) => (
          <div key={c.label} className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <span
                className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{
                  backgroundColor: c.color,
                  border: c.color === '#CBD5E1' ? '0.5px solid #94A3B8' : 'none'
                }}
              />
              <span className="text-sm leading-5 text-slate-700">{c.label}</span>
            </div>
            <span className="flex-shrink-0 text-sm font-medium text-bears-navy">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
