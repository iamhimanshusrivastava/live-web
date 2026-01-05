import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, MessageSquare, Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/analytics';

/**
 * Admin dashboard page component
 * Provides instructors with session controls, analytics, and moderation tools
 */
export default function AdminDashboard() {
    const { sessionId } = useParams<{ sessionId: string }>();

    // Use session hook
    const { session, loading, messages, viewerCount, sendMessage, toggleChat, pinMessage, deleteMessage } = useSession(sessionId || '');

    // State
    const [adminMessage, setAdminMessage] = useState('');
    const [analytics, setAnalytics] = useState<any | null>(null);

    /**
     * Load session analytics from database
     */
    const loadAnalytics = async () => {
        if (!sessionId) return;

        try {
            const { data, error } = await supabase
                .from('session_analytics')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (error) {
                console.error('Error loading analytics:', error);
                return;
            }

            if (data) {
                setAnalytics(data);
            }
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
    };

    /**
     * Load analytics on mount
     */
    useEffect(() => {
        loadAnalytics();
    }, [sessionId]);

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        );
    }

    // Session not found
    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Session not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page header */}
                <h1 className="text-3xl font-semibold">Admin Dashboard</h1>

                {/* Stats cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Live Viewers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Live Viewers
                            </CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{viewerCount}</p>
                        </CardContent>
                    </Card>

                    {/* Total Messages */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Messages
                            </CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{messages.length}</p>
                        </CardContent>
                    </Card>

                    {/* Peak Viewers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Peak Viewers
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {analytics?.peak_viewers ?? '-'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Avg Watch Time */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg Watch Time
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {analytics?.avg_watch_duration_seconds
                                    ? `${Math.round(analytics.avg_watch_duration_seconds / 60)}m`
                                    : '-'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Session controls section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Session Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Chat enabled toggle */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="chat-enabled" className="text-sm font-medium">
                                Chat Enabled
                            </label>
                            <Switch
                                id="chat-enabled"
                                checked={session?.chat_enabled ?? false}
                                onCheckedChange={(checked) => {
                                    toggleChat(checked).catch((error) => {
                                        console.error('Failed to toggle chat:', error);
                                    });
                                }}
                            />
                        </div>

                        {/* Admin message */}
                        <div className="space-y-2">
                            <label htmlFor="admin-message" className="text-sm font-medium">
                                Admin Message
                            </label>
                            <Textarea
                                id="admin-message"
                                placeholder="Type an admin message to broadcast..."
                                value={adminMessage}
                                onChange={(e) => setAdminMessage(e.target.value)}
                                rows={3}
                            />
                            <Button
                                onClick={() => {
                                    if (!adminMessage.trim()) return;

                                    sendMessage(adminMessage, 'admin')
                                        .then(() => {
                                            setAdminMessage('');
                                        })
                                        .catch((error) => {
                                            console.error('Failed to send admin message:', error);
                                        });
                                }}
                                disabled={!adminMessage.trim()}
                            >
                                Send Admin Message
                            </Button>
                        </div>

                        {/* End session */}
                        <div className="space-y-2 pt-4 border-t">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={async () => {
                                    if (!sessionId) return;

                                    try {
                                        // Update session to not live
                                        const { error: updateError } = await supabase
                                            .from('sessions')
                                            .update({ is_live: false })
                                            .eq('id', sessionId);

                                        if (updateError) throw updateError;

                                        // Generate analytics report
                                        const { error: rpcError } = await supabase.rpc(
                                            'compute_session_analytics',
                                            { p_session_id: sessionId }
                                        );

                                        if (rpcError) throw rpcError;

                                        // Log session end event
                                        logEvent('session_ended', {
                                            sessionId,
                                            timestamp: new Date().toISOString(),
                                        });

                                        // Reload analytics
                                        await loadAnalytics();
                                    } catch (error) {
                                        console.error('Failed to end session:', error);
                                    }
                                }}
                            >
                                End Session & Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Message moderation section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {messages.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No messages yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {messages
                                    .slice(-10)
                                    .reverse()
                                    .map((message) => (
                                        <div
                                            key={message.id}
                                            className="flex items-start justify-between gap-4 p-3 border rounded-lg"
                                        >
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {message.user_name}
                                                    </span>
                                                    {message.is_pinned && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Pinned
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground break-words">
                                                    {message.content}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        pinMessage(message.id, !message.is_pinned).catch(
                                                            (error) => {
                                                                console.error(
                                                                    'Failed to pin/unpin message:',
                                                                    error
                                                                );
                                                            }
                                                        );
                                                    }}
                                                >
                                                    {message.is_pinned ? 'Unpin' : 'Pin'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        deleteMessage(message.id).catch((error) => {
                                                            console.error(
                                                                'Failed to delete message:',
                                                                error
                                                            );
                                                        });
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Session Analytics (conditional) */}
                {analytics && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Analytics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Total Viewers
                                    </dt>
                                    <dd className="text-sm font-semibold">
                                        {analytics.total_viewers}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Peak Viewers
                                    </dt>
                                    <dd className="text-sm font-semibold">
                                        {analytics.peak_viewers}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Total Messages
                                    </dt>
                                    <dd className="text-sm font-semibold">
                                        {analytics.total_messages}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">
                                        Unique Chatters
                                    </dt>
                                    <dd className="text-sm font-semibold">
                                        {analytics.unique_chatters}
                                    </dd>
                                </div>
                            </dl>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    if (!analytics.chat_log) return;

                                    // Create blob from chat log
                                    const blob = new Blob(
                                        [JSON.stringify(analytics.chat_log, null, 2)],
                                        { type: 'application/json' }
                                    );

                                    // Create download link
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `session-${sessionId}-chat.json`;

                                    // Trigger download
                                    document.body.appendChild(link);
                                    link.click();

                                    // Cleanup
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                Download Chat Log (JSON)
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
