import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { authDebugger } from '../lib/authDebug';

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    authDebugger.log('Password reset form submitted');
    setError(null);

    if (newPassword !== confirmPassword) {
      const mismatchError = "Passwords don't match";
      authDebugger.logError('Password reset validation failed', mismatchError);
      setError(mismatchError);
      return;
    }

    if (newPassword.length < 6) {
      const lengthError = 'Password must be at least 6 characters';
      authDebugger.logError('Password reset validation failed', lengthError);
      setError(lengthError);
      return;
    }

    setLoading(true);

    try {
      authDebugger.log('Attempting to update password');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      authDebugger.log('Password updated successfully');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: { 
            message: 'Password updated successfully. Please sign in with your new password.',
            status: 'success'
          }
        });
      }, 2000);
    } catch (err) {
      authDebugger.logError('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Password Updated</h2>
          <p className="mt-2 text-gray-600">
            Your password has been successfully updated. Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center">
        <Lock className="mx-auto h-12 w-12 text-bears-orange" />
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Reset Your Password</h2>
        <p className="mt-2 text-gray-600">
          Please enter your new password below.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-bears-orange focus:border-bears-orange"
            placeholder="Enter your new password"
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-bears-orange focus:border-bears-orange"
            placeholder="Confirm your new password"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-bears-orange hover:bg-bears-orange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bears-orange disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
}