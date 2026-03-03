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

const categories = [
  { id: 'all', label: 'All Predictions' },
  { id: 'qb', label: 'QB' },
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
  const [filterStyle, setFilterStyle] = useState<'topics' | 'bubbles'>('topics');
  const [topicsPlacement, setTopicsPlacement] = useState<'under_nav' | 'under_hero'>('under_hero');

  const renderTopicsControls = () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
          2025 Topics
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setFilterStyle('topics')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                filterStyle === 'topics'
                  ? 'bg-bears-navy text-white'
                  : 'text-slate-600'
              }`}
            >
              Topics
            </button>
            <button
              type="button"
              onClick={() => setFilterStyle('bubbles')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                filterStyle === 'bubbles'
                  ? 'bg-bears-navy text-white'
                  : 'text-slate-600'
              }`}
            >
              Bubbles
            </button>
          </div>
          <div className="inline-flex rounded-full border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setTopicsPlacement('under_nav')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                topicsPlacement === 'under_nav'
                  ? 'bg-bears-orange text-white'
                  : 'text-slate-600'
              }`}
            >
              Under Nav
            </button>
            <button
              type="button"
              onClick={() => setTopicsPlacement('under_hero')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                topicsPlacement === 'under_hero'
                  ? 'bg-bears-orange text-white'
                  : 'text-slate-600'
              }`}
            >
              Under Hero
            </button>
          </div>
        </div>
      </div>

      {filterStyle === 'topics' ? (
        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max items-center gap-8 pr-4">
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
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-bears-navy/30 bg-bears-navy/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-bears-navy">
            2025
          </span>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700">
            2026 Game-by-Game Picks
          </span>
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all sm:text-sm ${
                selectedCategory === category.id
                  ? 'border-bears-orange/45 bg-bears-orange/10 text-[#7a2604]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onRegisterClick={() => setIsRegisterModalOpen(true)}
      />

      <section className="border-b border-yellow-300 bg-yellow-200/80 px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm font-bold text-yellow-900 sm:text-base">
            2025 Season Prediction Results Are In
          </p>
          <button
            type="button"
            className="rounded-md border border-yellow-700/30 bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-900"
          >
            View Fan Recap
          </button>
        </div>
      </section>

      {topicsPlacement === 'under_nav' && (
        <section className="px-4 pt-4 sm:pt-5">
          <div className="max-w-6xl mx-auto">
            {renderTopicsControls()}
          </div>
        </section>
      )}
      
      <section className="py-12 px-4 md:py-14 bg-bears-navy text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            Bears Prediction Tracker
          </h1>
          <div className="space-y-5">
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Make your calls on the biggest questions for the{' '}
              <span className="animated-underline first">2025 Bears season</span>. 
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
            {topicsPlacement === 'under_hero' && renderTopicsControls()}
            <PredictionInterface selectedCategory={selectedCategory} />

            <div className="text-sm font-semibold text-slate-500">
              How It Works
            </div>
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

      <footer className="bg-bears-navy text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-gray-300">
            <p>&copy; 2025 Bears Prediction Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
  );
}

export default AppComponent;
