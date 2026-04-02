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
    if (!user) {
      setIsAdmin(false);
      return;
    }

    let isMounted = true;

    const loadAdminState = async () => {
      const { data, error } = await supabase.rpc('current_user_is_admin');

      if (!isMounted) return;

      if (error) {
        console.error('Failed to verify admin state', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(Boolean(data));
    };

    loadAdminState();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-bears-orange" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
