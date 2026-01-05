import { useState, useEffect, useRef } from 'react';
import type { Session, Message } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/analytics';

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
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');

    // Rate limiting for messages
    const lastMessageTime = useRef<number>(0);

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
    const loadMessages = async (before?: number) => {
        let query = supabase
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(100);

        // If before is provided, load messages before that ID
        if (before) {
            query = query.lt('id', before);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading messages:', error);
            return;
        }

        if (data) {
            if (before) {
                // Prepend older messages
                setMessages((prev) => [...(data as Message[]), ...prev]);
            } else {
                // Replace messages (initial load)
                setMessages(data as Message[]);
            }
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
            .on(
                'system',
                { event: 'presence' },
                (payload) => {
                    // Track connection status
                    if (payload.event === 'join') {
                        setConnectionStatus('connected');
                    } else if (payload.event === 'leave') {
                        setConnectionStatus('disconnected');
                    }
                }
            )
            .subscribe((status) => {
                // Also track subscription status
                if (status === 'SUBSCRIBED') {
                    setConnectionStatus('connected');
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setConnectionStatus('disconnected');
                }
            });
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
        // Rate limiting: Check if 6 seconds have passed since last message
        const now = Date.now();
        const timeSinceLastMessage = now - lastMessageTime.current;

        if (timeSinceLastMessage < 6000) {
            throw new Error('Please wait before sending another message');
        }

        // Limit message length to 500 characters
        const sanitizedContent = content.trim().slice(0, 500);

        if (!sanitizedContent) {
            throw new Error('Message cannot be empty');
        }

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
            content: sanitizedContent,
            message_type: messageType,
        });

        if (error) throw error;

        // Update last message time after successful send
        lastMessageTime.current = now;

        // Log message sent event
        logEvent('message_sent', {
            sessionId,
            messageType,
            messageLength: sanitizedContent.length,
            timestamp: new Date().toISOString(),
        });
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

    // Load more messages (for pagination)
    const loadMoreMessages = async () => {
        if (messages.length > 0) {
            // Load messages before the first message ID
            await loadMessages(messages[0].id);
        }
    };

    // Return hook values
    return {
        session,
        messages,
        viewerCount,
        loading,
        connectionStatus,
        sendMessage,
        pinMessage,
        deleteMessage,
        toggleChat,
        joinSession,
        leaveSession,
        loadMoreMessages,
    };
}
