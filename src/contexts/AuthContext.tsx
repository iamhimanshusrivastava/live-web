import { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

/**
 * Authentication context type definition
 * Provides authentication state and methods throughout the application
 */
interface AuthContextType {
    /**
     * The currently authenticated Supabase user
     * null if user is not authenticated
     */
    user: User | null;

    /**
     * The user's profile data from the profiles table
     * null if user is not authenticated or profile hasn't loaded
     */
    profile: Profile | null;

    /**
     * The current Supabase auth session
     * Contains access token, refresh token, and session metadata
     */
    session: Session | null;

    /**
     * Loading state indicator
     * true while checking authentication status or during auth operations
     */
    loading: boolean;

    /**
     * Sign in with email and password
     * @param email - User's email address
     * @param password - User's password
     * @returns Promise that resolves when sign in is complete
     */
    signIn: (email: string, password: string) => Promise<void>;

    /**
     * Sign up a new user with email, password, and full name
     * @param email - User's email address
     * @param password - User's password
     * @param fullName - User's full name
     * @returns Promise that resolves when sign up is complete
     */
    signUp: (email: string, password: string, fullName: string) => Promise<void>;

    /**
     * Sign out the current user
     * Clears session and redirects to login
     * @returns Promise that resolves when sign out is complete
     */
    signOut: () => Promise<void>;

    /**
     * Verify user's email with OTP code
     * @param email - User's email address
     * @param token - OTP token sent to email
     * @returns Promise that resolves when verification is complete
     */
    verifyEmail: (email: string, token: string) => Promise<void>;
}

/**
 * Auth context - provides authentication state and methods
 * Must be used within AuthProvider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context value
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Authentication provider component
 * Wraps the application to provide authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    // State management
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Helper function to fetch user profile from database
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return;
        }

        if (data) {
            setProfile(data as Profile);
        }
    };

    // Initialize auth session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                await fetchProfile(currentSession.user.id);
            }

            setLoading(false);
        };

        initializeAuth();

        // Cleanup function (empty for now)
        return () => { };
    }, []);

    // Stub authentication methods (to be implemented)
    const signIn = async (email: string, password: string): Promise<void> => {
        // TODO: Implement sign in logic
        console.log('signIn called with:', email);
    };

    const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
        // TODO: Implement sign up logic
        console.log('signUp called with:', email, fullName);
    };

    const signOut = async (): Promise<void> => {
        // TODO: Implement sign out logic
        console.log('signOut called');
    };

    const verifyEmail = async (email: string, token: string): Promise<void> => {
        // TODO: Implement email verification logic
        console.log('verifyEmail called with:', email, token);
    };

    // Context value
    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        verifyEmail,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
