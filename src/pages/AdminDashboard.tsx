import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, MessageSquare, Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';

/**
 * Admin dashboard page component
 * Provides instructors with session controls, analytics, and moderation tools
 */
export default function AdminDashboard() {
    const { sessionId } = useParams<{ sessionId: string }>();

    // Use session hook
    const { session, loading, messages, viewerCount } = useSession(sessionId || '');

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
                    <CardContent>
                        <p className="text-muted-foreground">
                            Session controls will be implemented here
                        </p>
                    </CardContent>
                </Card>

                {/* Message moderation section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Message Moderation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Message moderation tools will be implemented here
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
