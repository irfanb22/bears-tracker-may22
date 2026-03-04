import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginModal } from './LoginModal';
import BearClawLogo from '../assets/bears_claw_logo.png';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  onRegisterClick?: () => void;
}

export function Navbar({ onRegisterClick }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAdminState = async () => {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
        }
        return;
      }

      const { data, error } = await supabase.rpc('current_user_is_admin');
      if (isMounted) {
        setIsAdmin(!error && Boolean(data));
      }
    };

    loadAdminState();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'My Predictions', path: '/dashboard' },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/predictions';
    }

    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/15 bg-bears-navy/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 md:h-20">
          <button
            type="button"
            className="flex items-center gap-3 rounded-md pr-2 text-left"
            onClick={() => navigate('/')}
          >
            <img
              src={BearClawLogo}
              alt="Bears Prediction Tracker"
              className="h-10 w-10 object-contain mix-blend-screen contrast-125 saturate-125 sm:h-11 sm:w-11"
            />
            <span className="text-base font-extrabold tracking-wide text-white sm:text-lg">
              Bears Prediction Tracker
            </span>
          </button>

          {user && (
            <>
              <div className="hidden items-center gap-1 xl:gap-2 md:flex">
                {navItems.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <div className="hidden max-w-[220px] items-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-gray-300 xl:flex">
                  <span className="truncate text-xs font-medium">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <span>Log Out</span>
                </button>
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-md p-2 text-white transition-colors hover:bg-white/10 md:hidden"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </>
          )}

          {!user && (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Log In
                  </button>
                  <button
                    onClick={onRegisterClick}
                    className="rounded-lg bg-bears-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-bears-orange/90"
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="rounded-md p-2 text-white transition-colors hover:bg-white/10"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
              className="border-t border-white/10 md:hidden"
            >
              <div className="space-y-1 py-3">
                {user ? (
                  <>
                    {navItems.map((item) => {
                      const active = isActive(item.path);

                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setIsMenuOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold transition-colors ${
                            active
                              ? 'bg-white/10 text-white'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    <div className="my-2 h-px w-full bg-white/10" />
                    <div className="flex w-full items-center px-4 py-2 text-gray-300">
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded-md px-4 py-3 text-left text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
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
                      className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Log In
                    </button>
                    <div className="px-4 pt-1">
                      <button
                        onClick={() => {
                          onRegisterClick?.();
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-center rounded-md bg-bears-orange px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-bears-orange/90"
                      >
                        Sign Up
                      </button>
                    </div>
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
        onSwitchToRegister={onRegisterClick ?? (() => {})}
      />
    </nav>
  );
}
