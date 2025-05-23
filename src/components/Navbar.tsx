import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart as ChartBar, LogOut, Menu, X, HelpCircle, User, Settings } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginModal } from './LoginModal';
import BearClawLogo from '../assets/bears_claw_logo.png';

interface NavbarProps {
  onRegisterClick?: () => void;
}

export function Navbar({ onRegisterClick }: NavbarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    // Redirect to home page instead of login
    navigate('/');
  };

  const isAdmin = user?.email === 'irfanbhanji@gmail.com';

  return (
    <nav className="sticky top-0 bg-bears-navy border-b border-white/20 z-50">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 mr-4">
            <div 
              className="flex items-center gap-4 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <img 
                src={BearClawLogo} 
                alt="Bears Prediction Tracker" 
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">Bears Prediction Tracker</span>
            </div>
          </div>

          {user && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-md"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>How It Works</span>
                </button>
                <button
                  onClick={() => navigate('/predictions')}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-md"
                >
                  <ChartBar className="w-5 h-5" />
                  <span>Your Predictions</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 px-3 lg:px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-md"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Admin</span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-3 lg:px-4 py-2 text-gray-400 rounded-md">
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-md"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white p-2 -mr-2 hover:bg-white/5 rounded-md transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          )}

          {!user && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center">
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  How It Works
                </button>
                <div className="flex items-center space-x-4 ml-4">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Log In
                  </button>
                  <button
                    onClick={onRegisterClick}
                    className="px-4 py-2 bg-bears-orange text-white rounded-lg hover:bg-bears-orange/90 transition-colors whitespace-nowrap"
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="sm:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white p-2 -mr-2 hover:bg-white/5 rounded-md transition-colors"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10"
            >
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/how-it-works');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-md"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>How It Works</span>
                </button>
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate('/predictions');
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-md"
                    >
                      <ChartBar className="w-5 h-5" />
                      <span>Your Predictions</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-md"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Admin</span>
                      </button>
                    )}
                    <div className="flex items-center gap-3 w-full px-4 py-3 text-gray-400">
                      <User className="w-5 h-5" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-md"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-md"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        onRegisterClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white bg-bears-orange hover:bg-bears-orange/90 transition-colors rounded-md mx-4"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={onRegisterClick}
      />
    </nav>
  );
}