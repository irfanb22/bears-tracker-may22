import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      const { data, error } = await supabase.rpc('current_user_is_admin');
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to check admin status:', error.message);
        }
        if (isMounted) {
          setIsAdmin(false);
        }
        return;
      }

      if (isMounted) {
        setIsAdmin(Boolean(data));
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
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
