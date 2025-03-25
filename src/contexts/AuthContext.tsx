
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { InsertTables } from '@/types/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkIsAdmin: (user: User) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin emails for special handling
const ADMIN_EMAILS = ["zenoramgmt@gmail.com", "anshparikh@gmail.com", "anvisrini@gmail.com"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function setupAuth() {
      setLoading(true);
      
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (event === 'SIGNED_IN') {
            toast({
              title: "Welcome back!",
              description: "You've successfully signed in to your account."
            });
            
            // Only handle navigation if not already on dashboard/admin pages
            if (!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/admin')) {
              // Redirect to appropriate dashboard based on user role
              if (session?.user && checkIsAdmin(session.user)) {
                navigate('/admin');
              } else {
                navigate('/dashboard');
              }
            }
          } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You've been successfully signed out."
            });
            navigate('/');
          } else if (event === 'USER_UPDATED') {
            toast({
              title: "Account updated",
              description: "Your account information has been updated."
            });
          }
        }
      );

      // THEN check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle initial session - redirect if needed
      if (session?.user) {
        // Only redirect if on login page or root
        if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
          if (checkIsAdmin(session.user)) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      }

      return () => subscription.unsubscribe();
    }
    
    setupAuth();
  }, [navigate, location.pathname]);

  const checkIsAdmin = (user: User): boolean => {
    return ADMIN_EMAILS.includes(user.email || '');
  };

  const signIn = async (email: string, password: string, isAdmin: boolean = false) => {
    try {
      setLoading(true);
      
      // Special handling for admin account creation on first login
      if (isAdmin && ADMIN_EMAILS.includes(email)) {
        // Check if admin exists first
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Create admin account if it doesn't exist
          const { error: signUpError } = await supabase.auth.signUp({ 
            email,
            password,
            options: {
              data: {
                full_name: "Zenora Admin",
                is_admin: true
              }
            }
          });
          
          if (signUpError) throw signUpError;
        }
      }
      
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      // Navigate is handled in the auth state change listener
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      // Check if trying to sign up as admin - reject if not through admin login
      if (ADMIN_EMAILS.includes(email)) {
        toast({
          title: "Invalid email",
          description: "This email address is reserved. Please use a different one.",
          variant: "destructive",
        });
        throw new Error("This email address is reserved");
      }
      
      // Step 1: Create the auth user
      const { error: signUpError, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            is_admin: false
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (signUpError) {
        toast({
          title: "Signup failed",
          description: signUpError.message,
          variant: "destructive",
        });
        throw signUpError;
      }

      // Step 2: After auth user is created, add user to clients table
      if (data.user) {
        // Create client record with the user's information
        const clientData: InsertTables<'clients'> = {
          id: data.user.id,
          email: email,
          full_name: fullName,
          phone: null,
          address: null
        };

        const { error: clientError } = await supabase
          .from('clients')
          .insert([clientData]);

        if (clientError) {
          console.error('Error creating client record:', clientError);
          toast({
            title: "Account created but client profile setup failed",
            description: "Your account was created but there was an issue setting up your profile. Please contact support.",
            variant: "destructive",
          });
        } else {
          console.log('Client record created successfully');
        }
      }
      
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account."
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, checkIsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
