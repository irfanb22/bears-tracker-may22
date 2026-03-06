import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && !showForgotPassword && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-md">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                  <XCircle className="w-6 h-6" />
                </button>
                <AuthForm 
                  mode="login" 
                  isModal 
                  onClose={onClose}
                  onSwitchMode={onSwitchToRegister}
                  onForgotPassword={() => setShowForgotPassword(true)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          onClose();
        }}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </>
  );
}