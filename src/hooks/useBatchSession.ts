import { useState, useEffect } from 'react';
import { getBatch, getUser, getStoredUser, storeUser, clearStoredUser } from '@/lib/codekaro';
import type { CodekaroUser } from '@/lib/codekaro';

export interface BatchSession {
    id: string;
    title: string;
    topic: string;
    description?: string;
    scheduledStart: Date;
    screenUrl: string | null;
    faceUrl: string | null;
    isValid: boolean;
    videoDuration: number | null;  // Duration in seconds, null if not ended yet
}

export interface UseBatchSessionReturn {
    /** Session data from Codekaro */
    session: BatchSession | null;
    /** Authenticated user */
    user: CodekaroUser | null;
    /** Loading state */
    loading: boolean;
    /** Error message */
    error: string | null;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Whether email modal should be shown */
    showEmailModal: boolean;
    /** Verify email and authenticate */
    verifyEmail: (email: string) => Promise<boolean>;
    /** Logout */
    logout: () => void;
}

/**
 * Hook to manage Codekaro batch sessions
 * Uses Codekaro batch ID directly (no Supabase UUID required)
 */
export function useBatchSession(batchId: string): UseBatchSessionReturn {
    const [session, setSession] = useState<BatchSession | null>(null);
    const [user, setUser] = useState<CodekaroUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);

    /**
     * Load batch data from Codekaro
     */
    const loadBatch = async () => {
        setLoading(true);
        setError(null);

        try {
            const batch = await getBatch(batchId);

            if (!batch) {
                setError('Session not found');
                setLoading(false);
                return;
            }

            // Check if stream has ended (stored in localStorage)
            const endDataKey = `stream_end_${batch.time}`;
            const storedEndData = localStorage.getItem(endDataKey);
            let videoDuration: number | null = null;

            if (storedEndData) {
                try {
                    const endInfo = JSON.parse(storedEndData);
                    videoDuration = endInfo.duration;
                    console.log(`[useBatchSession] Found stored end data: duration=${videoDuration}s`);
                } catch (e) {
                    console.error('Failed to parse stored end data:', e);
                }
            }

            // Transform Codekaro batch to session format
            const batchSession: BatchSession = {
                id: batch.id,
                title: batch.title,
                topic: batch.topic,
                description: batch.description,
                scheduledStart: new Date(batch.time),
                screenUrl: batch.screenUrl || null,
                faceUrl: batch.url || null,
                isValid: !!(batch.screenUrl || batch.url),
                videoDuration: videoDuration,
            };

            setSession(batchSession);
        } catch (err) {
            console.error('Error loading batch:', err);
            setError('Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Check for stored user on mount
     */
    const checkStoredUser = () => {
        const stored = getStoredUser();
        if (stored) {
            setUser(stored);
            setShowEmailModal(false);
        } else {
            setShowEmailModal(true);
        }
    };

    /**
     * Verify email against Codekaro API
     */
    const verifyEmail = async (email: string): Promise<boolean> => {
        try {
            const userData = await getUser(email);

            if (!userData) {
                setError('Email not found. Please use your registered Codekaro email.');
                return false;
            }

            setUser(userData);
            storeUser(userData);
            setShowEmailModal(false);
            setError(null);
            return true;
        } catch (err) {
            console.error('Error verifying email:', err);
            setError('Failed to verify email. Please try again.');
            return false;
        }
    };

    /**
     * Logout and clear stored user
     */
    const logout = () => {
        clearStoredUser();
        setUser(null);
        setShowEmailModal(true);
    };

    /**
     * Initialize on mount
     */
    useEffect(() => {
        loadBatch();
        checkStoredUser();
    }, [batchId]);

    return {
        session,
        user,
        loading,
        error,
        isAuthenticated: !!user,
        showEmailModal,
        verifyEmail,
        logout,
    };
}
