import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navbar } from './Navbar';

export function UnsubscribeStatusPage() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('status') === 'success';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <div className={`px-8 py-8 text-white sm:px-10 ${
            isSuccess
              ? 'bg-gradient-to-r from-bears-navy to-slate-800'
              : 'bg-gradient-to-r from-slate-700 to-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {isSuccess ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-bears-orange">Email Preferences</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">
                  {isSuccess ? "You're unsubscribed" : "We couldn't complete that request"}
                </h1>
              </div>
            </div>
          </div>

          <div className="px-8 py-8 sm:px-10">
            <p className="text-lg leading-8 text-slate-700">
              {isSuccess
                ? 'You will no longer receive Bears Prediction Tracker recap and reminder emails.'
                : 'That unsubscribe link could not be processed. It may be incomplete, expired, or already invalid.'}
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              {isSuccess
                ? 'You are all set. Your email preferences have been updated.'
                : 'If you still want to be removed from future emails, please try the most recent link from your inbox or contact support.'}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-2xl bg-bears-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-bears-orange/90"
              >
                Return to Site
              </Link>
              {!isSuccess && (
                <Link
                  to="/season-recap"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Back to Recap
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
