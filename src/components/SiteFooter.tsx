export function SiteFooter() {
  return (
    <footer className="bg-bears-navy py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center text-slate-300">
          <p className="text-sm font-medium tracking-wide text-slate-300/90 sm:text-base">
            &copy; 2026 Bears Prediction Tracker. All rights reserved.
          </p>
          <div className="mx-auto mt-6 h-px w-full max-w-xl bg-white/10" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300/90 sm:text-base">
            <button type="button" className="transition-colors hover:text-white">
              Privacy Policy
            </button>
            <span className="text-slate-400/80">|</span>
            <button type="button" className="transition-colors hover:text-white">
              Terms of Service
            </button>
            <span className="text-slate-400/80">|</span>
            <button type="button" className="transition-colors hover:text-white">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
