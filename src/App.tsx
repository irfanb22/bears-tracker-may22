import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Navbar } from './components/Navbar';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { PredictionCard } from './components/PredictionCard';
import { PredictionInterface } from './components/PredictionInterface';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { HowItWorks } from './components/HowItWorks';
import { useAuth } from './lib/auth';
import { AuthCallback } from './components/AuthCallback';
import { RegisterModal } from './components/RegisterModal';
import { LoginModal } from './components/LoginModal';
import { GameForecastModal } from './components/GameForecastModal';
import { DebugPanel } from './components/DebugPanel';
import { AuthDebugPanel } from './components/AuthDebugPanel';
import { DebugPredictionAccess } from './components/DebugPredictionAccess';

const predictions = [
  {
    title: "Caleb's Sophomore Season",
    description: "Will the second-year QB break records? Predict Williams' passing yards, touchdowns, and completion percentage in year two.",
    imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1000",
    buttonText: "Make Your Predictions",
  },
];

const categories = [
  { id: 'all', label: 'All Predictions' },
  { id: 'player_stats', label: 'Player Stats' },
  { id: 'team_stats', label: 'Team Stats' },
  { id: 'draft_predictions', label: 'Draft Picks' }
];

function HomePage() {
  const { user } = useAuth();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGameForecastModalOpen, setIsGameForecastModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onRegisterClick={() => setIsRegisterModalOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
      />
      
      {/* Hero Section */}
      <section className="py-16 px-4 bg-bears-navy text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-10">
            Bears Prediction Tracker
          </h1>
          <div className="space-y-6">
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

      {/* Season Predictions Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-bears-navy mb-6">
            Predict Every Game
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Make your win/loss predictions for all 17 Bears games this season. 
            Lock in your forecasts before the season starts and see how your 
            predictions stack up against reality.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsGameForecastModalOpen(true)}
            className="px-8 py-4 bg-bears-orange text-white text-lg font-semibold rounded-lg hover:bg-bears-orange/90 transition-colors"
          >
            Predict the Season
          </motion.button>
        </div>
      </section>

      {/* Bears Season Predictions Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-4">
              <h2 className="text-3xl font-bold text-bears-navy">
                2025 Season Predictions
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 w-full sm:w-auto ${
                      selectedCategory === category.id
                        ? 'bg-bears-orange border-bears-orange text-white'
                        : 'bg-gray-100 border-bears-orange text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </motion.button>
                ))}
              </div>
            </div>
            <PredictionInterface selectedCategory={selectedCategory} />
          </div>
          
          {/* Add Debug Panel in Development */}
          {import.meta.env.DEV && <DebugPredictionAccess />}
        </div>
      </section>

      {/* Prediction Cards Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-8">
            {predictions.map((prediction) => (
              <PredictionCard 
                key={prediction.title} 
                {...prediction}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Sign-up CTA Section - Only show for non-authenticated users */}
      {!user && (
        <section className="py-20 px-4 bg-bears-navy">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8">
              <Calendar className="w-12 h-12 text-bears-orange" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
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

      {/* Footer */}
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

      <GameForecastModal
        isOpen={isGameForecastModalOpen}
        onClose={() => setIsGameForecastModalOpen(false)}
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