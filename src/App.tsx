import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Navbar } from './components/Navbar';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { PredictionInterface } from './components/PredictionInterface';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminEmailDashboard } from './components/AdminEmailDashboard';
import { HowItWorks } from './components/HowItWorks';
import { useAuth } from './lib/auth';
import { AuthCallback } from './components/AuthCallback';
import { RegisterModal } from './components/RegisterModal';
import { LoginModal } from './components/LoginModal';
import { DebugPanel } from './components/DebugPanel';
import { AuthDebugPanel } from './components/AuthDebugPanel';
import { DebugPredictionAccess } from './components/DebugPredictionAccess';
import { SiteFooter } from './components/SiteFooter';
import { ScrollToTop } from './components/ScrollToTop';
import { SeasonRecap } from './components/SeasonRecap';
import { UnsubscribeStatusPage } from './components/UnsubscribeStatusPage';
import { ANALYTICS_EVENTS, captureEvent, capturePageView } from './lib/analytics';
import { usePredictions } from './lib/PredictionContext';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'qb', label: 'QB' },
  { id: 'rookies', label: 'Rookies' },
  { id: 'player_stats', label: 'Player Stats' },
  { id: 'team_stats', label: 'Team Stats' },
  { id: 'awards', label: 'Awards' },
  { id: 'playoffs', label: 'Playoffs' },
  { id: 'draft_predictions', label: 'Draft' }
];

function HomePage() {
  const { user } = useAuth();
  const { questions } = usePredictions();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearchParams = new URLSearchParams(location.search);
  const initialSeasonParam = initialSearchParams.get('season');
  const initialCategoryParam = initialSearchParams.get('category');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(
    initialSeasonParam === '2025' || initialSeasonParam === '2026'
      ? Number(initialSeasonParam)
      : 2025
  );
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryParam || 'all');
  const previousCategoryRef = useRef(selectedCategory);

  useEffect(() => {
    if (previousCategoryRef.current === selectedCategory) return;

    captureEvent(ANALYTICS_EVENTS.categoryFilterChanged, {
      category: selectedCategory,
      previous_category: previousCategoryRef.current,
      surface: 'home',
    });
    previousCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  const seasonQuestions = questions.filter((question) => question.season === selectedSeason);
  const visibleCategories = categories.filter((category) => {
    if (category.id === 'all') return true;
    return seasonQuestions.some((question) => question.category === category.id);
  });

  useEffect(() => {
    if (!visibleCategories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [selectedCategory, visibleCategories]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authAction = params.get('auth');
    const redirectPath = params.get('redirect');

    if (user && authAction === 'login' && redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }

    if (user || authAction !== 'login') return;

    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  }, [location.search, navigate, user]);

  const clearAuthSearchParams = () => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete('auth');
    nextParams.delete('redirect');
    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: '/',
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    );
  };

  const renderTopicsControls = () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
          {[2025, 2026].map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => setSelectedSeason(season)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                selectedSeason === season
                  ? 'bg-bears-navy text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {season} Season
            </button>
          ))}
        </div>
      </div>

      <div className="relative border-b border-slate-200">
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-8 px-1 pr-14 sm:pr-4">
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`pb-3 text-base font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'border-b-2 border-bears-navy text-bears-navy'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {category.label}
              </button>
            ))}
            {selectedSeason === 2026 && (
              <span className="pb-3 text-base font-bold whitespace-nowrap text-slate-400">
                2026 Game-by-Game Picks
              </span>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" />
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onRegisterClick={() => setIsRegisterModalOpen(true)}
      />

      <section className="sticky top-16 z-40 border-b border-yellow-300 bg-yellow-200/95 px-4 py-2.5 md:top-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-3">
          <p className="text-center text-sm font-bold leading-tight text-yellow-900 sm:text-base">
            The 2025 Predictions Are Final
          </p>
          <button
            type="button"
            onClick={() => {
              captureEvent(ANALYTICS_EVENTS.seasonRecapCtaClicked, {
                destination: '/season-recap',
                source: 'home_banner',
              });
              navigate('/season-recap');
            }}
            className="w-full rounded-md border border-yellow-700/30 bg-yellow-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-yellow-900 sm:w-auto"
          >
            View Recap
          </button>
        </div>
      </section>

      <section className="py-12 px-4 md:py-14 bg-bears-navy text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            Bears Prediction Tracker
          </h1>
          <div className="space-y-5">
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Make your calls on the biggest questions for the{' '}
              <span className="animated-underline first">{selectedSeason} Bears season</span>.{' '}
              Back your predictions with{' '}
              <span className="animated-underline second">confidence</span> and 
              track your{' '}
              <span className="animated-underline third">accuracy</span> as 
              the season unfolds.
            </p>
            {!user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  captureEvent(ANALYTICS_EVENTS.signupCtaClicked, { source: 'home_hero' });
                  setIsRegisterModalOpen(true);
                }}
                className="px-8 py-4 bg-bears-orange text-white text-lg font-semibold rounded-lg hover:bg-bears-orange/90 transition-colors"
              >
                Get Started Now
              </motion.button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-7 sm:pt-9">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6">
            {renderTopicsControls()}
            <PredictionInterface
              selectedCategory={selectedCategory}
              selectedSeason={selectedSeason}
            />
          </div>
          
          {import.meta.env.DEV && <DebugPredictionAccess />}
        </div>
      </section>

      {!user && (
        <section className="py-16 px-4 bg-bears-navy">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Calendar className="w-12 h-12 text-bears-orange" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Sign up to save your predictions and follow each season
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-bears-orange text-white text-lg font-semibold rounded-lg hover:bg-bears-orange/90 transition-colors"
              onClick={() => {
                captureEvent(ANALYTICS_EVENTS.signupCtaClicked, { source: 'home_footer' });
                setIsRegisterModalOpen(true);
              }}
            >
              Get Started Now
            </motion.button>
          </div>
        </section>
      )}

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        source="home_register"
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <LoginModal 
        isOpen={isLoginModalOpen}
        source="home_login"
        onClose={() => {
          setIsLoginModalOpen(false);
          if (searchParams.get('auth') === 'login') {
            clearAuthSearchParams();
          }
        }}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <DebugPanel />
      <AuthDebugPanel />
    </div>
  );
}

function getRouteName(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname === '/season-recap') return 'season_recap';
  if (pathname === '/auth/callback') return 'auth_callback';
  if (pathname === '/how-it-works') return 'how_it_works';
  if (pathname === '/email/unsubscribed') return 'email_unsubscribed';
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/leaderboard') return 'leaderboard';
  if (pathname === '/admin') return 'admin';
  if (pathname === '/admin/email') return 'admin_email';
  return 'unknown';
}

function AnalyticsRouteTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    capturePageView(getRouteName(location.pathname), {
      is_authenticated: Boolean(user),
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  }, [location.pathname, location.search, user]);

  return null;
}

export function AppComponent() {
  return (
    <>
      <ScrollToTop />
      <AnalyticsRouteTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/season-recap" element={<SeasonRecap />} />
        <Route path="/email/unsubscribed" element={<UnsubscribeStatusPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route
          path="/predictions"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/email"
          element={
            <AdminProtectedRoute>
              <AdminEmailDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </>
  );
}

export default AppComponent;
