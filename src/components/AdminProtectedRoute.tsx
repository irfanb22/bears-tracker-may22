import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Simple admin check based on email
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Set admin status based on email check
    setIsAdmin(user.email === 'irfanbhanji@gmail.com');
  }, [user]);

  // Show loading state while checking
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-bears-orange" />
      </div>
    );
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render children if admin check passes
  return <>{children}</>;
}