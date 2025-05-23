import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Loader2, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authDebugger } from '../lib/authDebug';

interface AuthFormProps {
  mode: 'login' | 'register';
  isModal?: boolean;
  onClose?: () => void;
  onSwitchMode?: () => void;
  onForgotPassword?: () => void;
}

interface LocationState {
  message?: string;
  status?: 'success' | 'error';
  from?: string;
}

export function AuthForm({ mode, isModal, onClose, onSwitchMode, onForgotPassword }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();

  // Get state from location
  const state = location.state as LocationState;
  const returnPath = state?.from;

  useEffect(() => {
    // Check for verification success in URL params
    const verified = searchParams.get('verified');
    if (verified === 'true' && mode === 'login') {
      setStatusMessage('Email verified successfully! Please sign in with your credentials.');
      setMessageType('success');
    }
    // Check for message in location state
    else if (state?.message) {
      setStatusMessage(state.message);
      setMessageType(state.status || 'error');
    }
  }, [mode, searchParams, state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    authDebugger.log(`${mode} form submission started`, { email });
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        authDebugger.log('Attempting sign in');
        const { error: signInError, data } = await signIn(email, password);
        if (signInError) throw signInError;
        
        authDebugger.log('Sign in successful', { 
          user: data.user?.id,
          session: data.session?.access_token ? 'present' : 'missing'
        });
        
        // Close modal if in modal mode
        if (isModal && onClose) {
          onClose();
        }

        // Navigate to the return path or dashboard
        const redirectPath = returnPath || '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        authDebugger.log('Attempting sign up');
        const { error: signUpError, data } = await signUp(email, password);
        if (signUpError) throw signUpError;
        
        authDebugger.log('Sign up successful', {
          user: data.user?.id,
          confirmationSent: data.user?.confirmation_sent_at ? 'yes' : 'no'
        });
        
        setSuccess(true);
      }
    } catch (err) {
      authDebugger.logError(`${mode} error`, err);
      if (err instanceof Error) {
        // Handle specific error messages
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else if (err.message === 'User already registered') {
          setError(
            <div className="space-y-2">
              <p>An account with this email already exists.</p>
              <button
                onClick={onSwitchMode}
                className="text-bears-orange hover:text-bears-orange/90 underline"
              >
                Click here to sign in instead
              </button>
            </div>
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-bears-orange focus:border-bears-orange focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-bears-orange focus:border-bears-orange focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      {mode === 'login' && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-bears-navy hover:text-bears-orange transition-colors"
          >
            Forgot your password?
          </button>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-bears-orange hover:bg-bears-orange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bears-orange disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchMode}
          className="text-sm text-bears-navy hover:text-bears-orange"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </form>
  );

  if (success) {
    return (
      <div className={`${isModal ? '' : 'min-h-screen flex items-center justify-center bg-gray-50 px-4'}`}>
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Check Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a confirmation link to {email}. Click the link to complete your registration.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => {
                if (isModal && onClose) {
                  onClose();
                } else {
                  navigate('/', { replace: true });
                }
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-bears-navy hover:bg-bears-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bears-navy"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isModal) {
    return (
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-8">
        <div>
          <Mail className="mx-auto h-12 w-12 text-bears-orange" />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>

        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-4 rounded-md ${
                messageType === 'success' ? 'bg-green-50' : 'bg-red-50'
              } p-4`}
            >
              <div className="flex">
                {messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    messageType === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {statusMessage}
                  </h3>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-md bg-red-50 p-4"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </motion.div>
        )}

        {formContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <Mail className="mx-auto h-12 w-12 text-bears-orange" />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>

        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-md ${
                messageType === 'success' ? 'bg-green-50' : 'bg-red-50'
              } p-4`}
            >
              <div className="flex">
                {messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    messageType === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {statusMessage}
                  </h3>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md bg-red-50 p-4"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </motion.div>
        )}

        {formContent}
      </div>
    </div>
  );
}