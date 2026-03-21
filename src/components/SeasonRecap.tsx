import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { RegisterModal } from './RegisterModal';
import { LoginModal } from './LoginModal';
import recapHeroImage from '../assets/ben and caleb.jpeg';
import odunzeImage from '../assets/OdunRo00_2024.jpg';
import PlayoffSplitChart from './PlayoffSplitChart';
import DraftPickChart from './DraftPickChart';

const revisedAccuracyRows = [
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

function HeroFigure() {
  return (
    <figure className="mt-8 mb-8">
      <div className="overflow-hidden rounded-[2rem] bg-slate-100 shadow-sm">
        <img
          src={recapHeroImage}
          alt="Caleb Williams smiling with Ben Johnson on the sideline"
          className="h-[320px] w-full object-cover object-center md:h-[440px]"
        />
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-slate-500">
        Photo: Jacob Funk/Chicago Bears.
      </figcaption>
    </figure>
  );
}

function RevisedAccuracyChart() {
  const getBarColor = (pct: number) => {
    if (pct > 60) return 'bg-bears-navy';
    if (pct >= 40) return 'bg-bears-orange';
    return 'bg-orange-300';
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Bears Prediction Tracker
      </p>
      <h3 className="mt-2 text-xl font-black leading-tight text-bears-navy sm:text-2xl">
        How accurate were Bears fans across all 13 predictions?
      </h3>
      <p className="mt-2 text-sm text-slate-500">Percentage of fans who predicted correctly</p>

      <div className="mt-5 flex flex-col gap-2.5">
        {revisedAccuracyRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="text-[15px] leading-6 text-slate-700 sm:w-48 sm:min-w-[160px] sm:text-right md:min-w-[200px]">
              {row.label}
            </div>
            <div className="flex items-center gap-3 sm:flex-1">
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200 sm:h-5">
                <div
                  className={`h-full rounded-full ${getBarColor(row.pct)}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <div className="min-w-[40px] text-sm font-bold text-bears-navy">{row.pct}%</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-bears-navy" />
          60%+
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-bears-orange" />
          40-60%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-300" />
          Under 40%
        </span>
      </div>
    </div>
  );
}

function InlineCta() {
  return (
    <div className="rounded-[1.75rem] border border-bears-orange/20 bg-orange-50 px-6 py-5">
      <p className="text-base leading-8 text-slate-700">
        <span className="font-bold text-bears-navy">Want to see how you did?</span> Check your
        results in{' '}
        <Link
          to="/dashboard"
          className="font-semibold text-bears-orange underline-offset-4 hover:underline"
        >
          My Predictions
        </Link>{' '}
        or see where you stand on the{' '}
        <Link
          to="/leaderboard"
          className="font-semibold text-bears-orange underline-offset-4 hover:underline"
        >
          Leaderboard
        </Link>
        .
      </p>
    </div>
  );
}

function MidPieceCta() {
  return (
    <div className="rounded-[1.75rem] border border-bears-navy/10 bg-bears-navy px-6 py-6 text-white">
      <p className="text-lg font-bold">See how your picks stacked up.</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">
        Check{' '}
        <Link to="/dashboard" className="font-semibold text-white underline underline-offset-4">
          My Predictions
        </Link>{' '}
        to see your scorecard, or visit the{' '}
        <Link to="/leaderboard" className="font-semibold text-white underline underline-offset-4">
          Leaderboard
        </Link>{' '}
        to see where you rank.
      </p>
    </div>
  );
}

function CalebRecordCallout() {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-bears-orange">
        Caleb vs. The Record
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Erik Kramer (1995)</p>
          <p className="mt-1 text-4xl font-black text-bears-navy">3,838</p>
          <p className="text-sm text-slate-600">yards</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Set in a 16-game season</p>
        </div>
        <div className="border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="text-sm uppercase tracking-wide text-slate-500">Caleb Williams (2025)</p>
          <p className="mt-1 text-4xl font-black text-bears-orange">3,942</p>
          <p className="text-sm text-slate-600">yards</p>
        </div>
      </div>
    </div>
  );
}

function OdunzeStatsCallout() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-stretch gap-0">
        <div className="w-24 flex-shrink-0 bg-slate-100 sm:w-28">
          <img
            src={odunzeImage}
            alt="Rome Odunze"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50">
            <div className="rounded-t-[1.1rem] bg-bears-navy px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:px-4 sm:text-xs">
              Rome Odunze 2025
            </div>
            <div className="grid grid-cols-2 gap-3 px-3 py-3 sm:grid-cols-4 sm:gap-4 sm:px-4 sm:py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">YDS</p>
                <p className="mt-1 text-2xl font-black text-bears-navy sm:text-3xl">661</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">TD</p>
                <p className="mt-1 text-2xl font-black text-bears-navy sm:text-3xl">6</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">AVG</p>
                <p className="mt-1 text-2xl font-black text-bears-navy sm:text-3xl">15.0</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Games</p>
                <p className="mt-1 text-2xl font-black text-bears-orange sm:text-3xl">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OffenseSurpriseCallout() {
  return (
    <div className="max-w-xs rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-bears-orange">
        The Offense No One Saw Coming
      </p>
      <div className="mt-3 text-center">
        <p className="text-4xl font-black text-bears-navy">4th</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
          In Total Offense
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-700">375.7 YPG</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Fans who predicted top 10: <span className="font-bold text-bears-orange">40%</span>
        </p>
      </div>
    </div>
  );
}

function RevisedRecap() {
  return (
    <article className="mx-auto max-w-4xl">
      <header className="border-b border-slate-300 pb-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-bears-orange">
          2025 Season Recap
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-bears-navy md:text-6xl">
          How Bears Fans Predicted the Season
        </h1>
        <HeroFigure />
        <div className="max-w-3xl space-y-4 text-lg leading-8 text-slate-700">
          <p>13 predictions. 1 season. Some calls were obvious. Others split the fanbase right down the middle.</p>
          <p>
            Before the season started, Bears Prediction Tracker asked fans to make calls on
            everything from Caleb&apos;s stats to the draft to whether this team would end the playoff
            drought. Hundreds of you locked in your picks.
          </p>
          <p>The dust has settled. Here&apos;s how you did.</p>
        </div>
      </header>

      <div className="mt-10 space-y-12">
        <RevisedAccuracyChart />
        <InlineCta />

        <section className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-bears-navy">The Season in Context</h2>
          <div className="mt-6 space-y-5 text-lg leading-8 text-slate-800">
            <p>
              There was cautious optimism heading into 2025. New head coach. Second-year
              quarterback with sky-high potential. Most fans weren&apos;t sure if this was a playoff
              team or another rebuilding year.
            </p>
            <p>
              The Bears exceeded expectations. The offense clicked in the second half. The playoff
              drought ended. Chicago picked up its first playoff win in over a decade. Caleb
              delivered clutch performances down the stretch. But if you watched the games, you
              knew. Iceman.
            </p>
            <p>Now to the predictions.</p>
          </div>
        </section>

        <section className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-bears-navy">The Sure Things</h2>
          <div className="mt-6 space-y-5 text-lg leading-8 text-slate-800">
            <p>Some predictions showed overwhelming consensus and fans nailed them.</p>
            <p>
              Caleb Williams breaking the Bears&apos; single-season passing record was the most
              confident correct call of the year. Williams threw for 3,942 yards, surpassing Erik
              Kramer&apos;s franchise mark.
            </p>
            <p className="font-semibold text-bears-navy">
              90% of fans predicted it, most with high confidence.
            </p>
            <CalebRecordCallout />
            <p>
              He still fell short of 4,000 yards. No Bears quarterback has ever hit that mark. That
              will be a prediction in 2026.
            </p>
            <p>
              He started every game, something 58% of fans correctly predicted, though confidence
              was mixed. Durability for a Bears QB has been a question mark.
            </p>
            <p>
              One question we probably should have asked was completion percentage. Ben&apos;s stated
              goal for him was 70%, but Williams finished at a league-low 59%.
            </p>
            <p>
              87% correctly predicted the Bears would not finish as a top-10 defense, most with
              high confidence. It would have been a bottom-10 unit if not for leading the league in
              turnovers.
            </p>
            <p>
              72% predicted the Bears would win more than eight games. Correct. Joe Thuney making
              the Pro Bowl was another solid call, with 68% of fans getting it right. The offensive
              line was a big reason the offense clicked. Ben Johnson being named a Coach of the Year
              finalist? 79% saw it coming.
            </p>
          </div>
        </section>

        <section className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-bears-navy">The Coin Flip</h2>
          <div className="mt-6 space-y-5 text-lg leading-8 text-slate-800">
            <p>
              The Bears making the playoffs was the most divisive prediction of the season. Just 54%
              picked correctly, with confidence spread almost evenly across the board.
            </p>
            <PlayoffSplitChart />
            <p>A true coin flip and the kind of question we&apos;ll have a lot more of in 2026.</p>
          </div>
        </section>

        <section className="max-w-3xl space-y-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-bears-navy">
              The Confident Misses
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-800">
              <p>Not every strong conviction landed.</p>
              <p>
                78% of fans predicted Rome Odunze would surpass 1,000 receiving yards. 52% made
                that call with high confidence. A late-season injury cost him 5 games, and he
                ultimately fell short of the milestone.
              </p>
            </div>
          </div>

          <OdunzeStatsCallout />

          <div className="space-y-5 text-lg leading-8 text-slate-800">
            <p>
              Montez Sweat reaching 10 sacks was another misread, but in the other direction. 73%
              of fans predicted he&apos;d fall short. Sweat just barely got there, a solid rebound from
              a disappointing 2024.
            </p>
            <p>
              The Bears&apos; offense exceeded expectations too, finishing 4th in the NFL in total
              offense at 375.7 yards per game.{' '}
              <span className="font-semibold text-bears-navy">
                Only 40% of fans expected the unit to crack the top ten, which made it one of the
                biggest surprises of the season.
              </span>
            </p>
          </div>

          <OffenseSurpriseCallout />
        </section>

        <section className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-bears-navy">
            The Impossible Question
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-8 text-slate-800">
            <p>The hardest question of the year: who would the Bears select with the 10th pick?</p>
            <p>
              Most fans expected Penn State tight end Tyler Warren. The Bears went with Colston
              Loveland, who wasn&apos;t even listed as an option.
            </p>
            <DraftPickChart />
          </div>
        </section>

        <MidPieceCta />

        <section className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-bears-navy">What&apos;s Next</h2>
          <div className="mt-6 space-y-5 text-lg leading-8 text-slate-800">
            <p>All 13 predictions are now resolved and up on the site.</p>
            <p>
              We&apos;re already working on 2026. More questions, more categories, and game-by-game
              picks for the full season. The first 2026 prediction drops in a couple of weeks,
              starting with the draft.
            </p>
            <div className="pt-2">
              <p className="font-semibold text-bears-navy">Bear Down 🐻⬇</p>
              <div className="mt-5">
                <p
                  className="text-4xl text-bears-navy"
                  style={{ fontFamily: '"Brush Script MT", "Snell Roundhand", cursive' }}
                >
                  Irfan
                </p>
                <p className="mt-1 text-sm italic text-slate-500">Creator and Editor</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export function SeasonRecap() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar onRegisterClick={() => setIsRegisterModalOpen(true)} />

      <main className="px-4 py-10 md:px-6 md:py-14">
        <RevisedRecap />
      </main>

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
    </div>
  );
}
