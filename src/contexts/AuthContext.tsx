import { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import {
    getUser,
    getStoredUser,
    storeUser,
    clearStoredUser,
    type CodekaroUser
} from '@/lib/codekaro';

/**
 * Authentication context type definition
 * Supports both Codekaro email-only auth and Supabase password auth
 */
interface AuthContextType {
    /** Supabase user (for password-based auth) */
    user: User | null;

    /** User's profile from Supabase profiles table */
    profile: Profile | null;

    /** Supabase auth session */
    session: Session | null;

    /** Codekaro user (for email-only auth) */
    codekaroUser: CodekaroUser | null;

    /** Loading state */
    loading: boolean;

    /** Whether user is authenticated (either via Codekaro or Supabase) */
    isAuthenticated: boolean;

    /** Get display name from either auth system */
    displayName: string | null;

    /** Get email from either auth system */
    email: string | null;

    /** Get avatar URL from either auth system */
    avatarUrl: string | null;

    /**
     * Login with email only via Codekaro API
     * This is the primary auth method for the streaming platform
     */
    loginWithEmail: (email: string) => Promise<boolean>;

    /** Sign in with email and password (Supabase fallback) */
    signIn: (email: string, password: string) => Promise<void>;

    /** Sign up with email and password (Supabase fallback) */
    signUp: (email: string, password: string, fullName: string) => Promise<void>;

    /** Sign out from both auth systems */
    signOut: () => Promise<void>;

    /** Verify against external system */
    verifyEmail: (externalId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Supabase auth state
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);

    // Codekaro auth state
    const [codekaroUser, setCodekaroUser] = useState<CodekaroUser | null>(null);

    const [loading, setLoading] = useState<boolean>(true);

    // Computed auth status
    const isAuthenticated = !!(user || codekaroUser);
    const displayName = codekaroUser?.name || profile?.full_name || user?.email || null;
    const email = codekaroUser?.email || profile?.email || user?.email || null;
    const avatarUrl = codekaroUser?.avatar || profile?.avatar_url || null;

    // Fetch Supabase profile
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

    // Initialize auth on mount
    useEffect(() => {
        const initializeAuth = async () => {
            // Check for stored Codekaro user first
            const storedUser = getStoredUser();
            if (storedUser) {
                setCodekaroUser(storedUser);
            }

            // Also check Supabase session
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                await fetchProfile(currentSession.user.id);
            }

            setLoading(false);
        };

        initializeAuth();

        // Subscribe to Supabase auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: string, currentSession: Session | null) => {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    await fetchProfile(currentSession.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    /**
     * Login with email only via Codekaro API
     * Primary auth method for the streaming platform
     */
    const loginWithEmail = async (emailInput: string): Promise<boolean> => {
        try {
            const codekaroUserData = await getUser(emailInput);

            if (!codekaroUserData) {
                throw new Error('User not found. Please check your email address.');
            }

            // Store user in localStorage
            storeUser(codekaroUserData);
            setCodekaroUser(codekaroUserData);

            return true;
        } catch (error) {
            console.error('Codekaro login failed:', error);
            throw error;
        }
    };

    // Supabase password auth (fallback)
    const signIn = async (emailInput: string, password: string): Promise<void> => {
        const { error } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password,
        });
        if (error) throw error;
    };

    const signUp = async (emailInput: string, password: string, fullName: string): Promise<void> => {
        const { error } = await supabase.auth.signUp({
            email: emailInput,
            password,
            options: {
                data: { full_name: fullName },
            },
        });
        if (error) throw error;
    };

    // Sign out from both auth systems
    const signOut = async (): Promise<void> => {
        // Clear Codekaro user
        clearStoredUser();
        setCodekaroUser(null);

        // Sign out from Supabase if logged in
        if (session) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        }
    };

    const verifyEmail = async (_externalId: string): Promise<boolean> => {
        // TODO: Implement when Edge Function is ready
        return false;
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        codekaroUser,
        loading,
        isAuthenticated,
        displayName,
        email,
        avatarUrl,
        loginWithEmail,
        signIn,
        signUp,
        signOut,
        verifyEmail,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

