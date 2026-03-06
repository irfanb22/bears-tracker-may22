import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Navbar } from './components/Navbar';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { PredictionInterface } from './components/PredictionInterface';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { AdminDashboard } from './components/AdminDashboard';
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

const categories = [
  { id: 'all', label: 'All Predictions' },
  { id: 'qb', label: 'QB' },
  { id: 'rookies', label: 'Rookies' },
  { id: 'player_stats', label: 'Player Stats' },
  { id: 'team_stats', label: 'Team Stats' },
  { id: 'pro_bowlers', label: 'Pro Bowlers' },
  { id: 'draft_predictions', label: 'Draft' },
  { id: 'playoffs', label: 'Playoffs' }
];

function HomePage() {
  const { user } = useAuth();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const renderTopicsControls = () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
          2026 Season
        </div>
      </div>

      <div className="relative border-b border-slate-200">
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-8 px-1 pr-14 sm:pr-4">
            {categories.map((category) => (
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
            <span className="pb-3 text-base font-bold whitespace-nowrap text-slate-400">
              2026 Game-by-Game Picks
            </span>
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
            2025 Predictions Are Live
          </p>
          <button
            type="button"
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
              <span className="animated-underline first">2026 Bears season</span>. 
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
                onClick={() => setIsRegisterModalOpen(true)}
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
            <PredictionInterface selectedCategory={selectedCategory} />
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
              Sign up to lock in your predictions before Week 1
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-bears-orange text-white text-lg font-semibold rounded-lg hover:bg-bears-orange/90 transition-colors"
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Get Started Now
            </motion.button>
          </div>
        </section>
      )}

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

      <DebugPanel />
      <AuthDebugPanel />
    </div>
  );
}

export function AppComponent() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </>
  );
}

export default AppComponent;
