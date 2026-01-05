import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/lib/database.types';

/**
 * Sessions list page component
 * Displays upcoming sessions that users can join
 */
export default function SessionsListPage() {
    const navigate = useNavigate();

    // State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * Load upcoming sessions from database
     */
    useEffect(() => {
        const loadSessions = async () => {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .select('*')
                    .gt('scheduled_start', new Date().toISOString())
                    .order('scheduled_start', { ascending: true });

                if (error) {
                    console.error('Error loading sessions:', error);
                    return;
                }

                if (data) {
                    setSessions(data as Session[]);
                }
            } catch (err) {
                console.error('Failed to load sessions:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSessions();
    }, []);

    /**
     * Navigate to session page
     */
    const handleJoinSession = (sessionId: string) => {
        navigate(`/session/${sessionId}`);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading sessions...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold mb-6">Upcoming Sessions</h1>

                {sessions.length === 0 ? (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-center text-muted-foreground">
                                No upcoming sessions found
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <Card key={session.id}>
                                <CardHeader>
                                    <CardTitle>{session.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Scheduled for
                                        </p>
                                        <p className="font-medium">
                                            {format(
                                                new Date(session.scheduled_start),
                                                'PPpp'
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleJoinSession(session.id)}
                                    >
                                        Join
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
