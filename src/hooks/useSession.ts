import { useState, useEffect } from 'react';
import type { Session, Message } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for managing session state and operations
 * @param sessionId - The ID of the session to manage
 * @returns Session state and operation functions
 */
export function useSession(sessionId: string) {
    // State management
    const [session, setSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [viewerCount, setViewerCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    // Load session data from database
    const loadSession = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error) {
            console.error('Error loading session:', error);
            return;
        }

        if (data) {
            setSession(data as Session);
        }

        setLoading(false);
    };

    // Load messages for this session
    const loadMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            console.error('Error loading messages:', error);
            return;
        }

        if (data) {
            setMessages(data as Message[]);
        }
    };

    // Update current viewer count
    const updateViewerCount = async () => {
        const { data, error } = await supabase
            .rpc('get_current_viewers', { p_session_id: sessionId });

        if (error) {
            console.error('Error updating viewer count:', error);
            return;
        }

        if (data !== null) {
            setViewerCount(data);
        }
    };

    // Subscribe to realtime updates
    let channel: ReturnType<typeof supabase.channel>;

    const subscribeToRealtime = () => {
        channel = supabase
            .channel(`session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    // Append new message to messages state
                    setMessages((current) => [...current, payload.new as Message]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    // Update the matching message in state
                    setMessages((current) =>
                        current.map((msg) =>
                            msg.id === payload.new.id ? (payload.new as Message) : msg
                        )
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    // Remove deleted message from state
                    setMessages((current) =>
                        current.filter((msg) => msg.id !== payload.old.id)
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'viewer_sessions',
                    filter: `session_id=eq.${sessionId}`,
                },
                () => {
                    // Update viewer count on any viewer_sessions change
                    updateViewerCount();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    // Update session state with new data
                    setSession(payload.new as Session);
                }
            )
            .subscribe();
    };

    // Initialize hook - load session and messages on mount
    useEffect(() => {
        console.log('Session hook mounted');
        loadSession();
        loadMessages();
        subscribeToRealtime();

        // Cleanup: unsubscribe from realtime channel
        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, []);

    // Message operations
    const sendMessage = async (
        content: string,
        messageType: 'user' | 'admin' = 'user'
    ) => {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Get user profile for the name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        // Insert message into database
        const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: user.id,
            user_name: profile?.full_name || user.email || 'Anonymous',
            content,
            message_type: messageType,
        });

        if (error) throw error;
    };

    const pinMessage = async (messageId: number, isPinned: boolean) => {
        // Update message pinned status
        const { error } = await supabase
            .from('messages')
            .update({ is_pinned: isPinned })
            .eq('id', messageId);

        if (error) throw error;
    };

    const deleteMessage = async (messageId: number) => {
        // Delete message from database
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
    };

    const toggleChat = async (enabled: boolean) => {
        // Update chat enabled status for the session
        const { error } = await supabase
            .from('sessions')
            .update({ chat_enabled: enabled })
            .eq('id', sessionId);

        if (error) throw error;
    };

    const joinSession = async () => {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Insert viewer session (ignore unique constraint violations)
        const { error } = await supabase.from('viewer_sessions').insert({
            session_id: sessionId,
            user_id: user.id,
        });

        // Ignore unique constraint violations (user already joined)
        if (error && !error.message.includes('duplicate key')) {
            throw error;
        }
    };

    const leaveSession = async () => {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Call leave_session RPC function
        const { error } = await supabase.rpc('leave_session', {
            p_session_id: sessionId,
            p_user_id: user.id,
        });

        if (error) throw error;
    };

    // Return hook values
    return {
        session,
        messages,
        viewerCount,
        loading,
        sendMessage,
        pinMessage,
        deleteMessage,
        toggleChat,
        joinSession,
        leaveSession,
    };
}
