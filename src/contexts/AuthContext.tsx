import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
  employeeData: any | null;
  setEmployeeData: (data: any) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ user: null, error: null }),
  signIn: async () => ({ user: null, error: null }),
  signOut: async () => {},
  isInitialized: false,
  setIsInitialized: () => {},
  employeeData: null,
  setEmployeeData: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);

  useEffect(() => {
    // Check if the system is initialized
    const checkInitialization = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('Error checking initialization:', error);
          return;
        }
        
        setIsInitialized(data && data.length > 0);
      } catch (error) {
        console.error('Error checking initialization:', error);
      }
    };

    checkInitialization();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // If user is logged in, check if they're an employee
        if (session?.user) {
          const { data: employee } = await supabase
            .from('employees')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();

          if (employee) {
            setEmployeeData(employee);
          }
        } else {
          setEmployeeData(null);
        }

        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      toast.error('An unexpected error occurred');
      return { user: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { user: null, error };
      }

      toast.success('Signed in successfully');
      return { user: data.user, error: null };
    } catch (error) {
      toast.error('An unexpected error occurred');
      return { user: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setEmployeeData(null);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isInitialized,
    setIsInitialized,
    employeeData,
    setEmployeeData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};