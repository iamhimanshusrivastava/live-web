import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/contexts/AuthContext';
import { logEvent } from '@/lib/analytics';

/**
 * Session page component
 * Main view for watching live sessions with video player and chat
 */
export default function SessionPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    // Video player ref
    const videoRef = useRef<HTMLVideoElement>(null);

    // Scroll area ref for auto-scroll
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auth context
    const { profile } = useAuth();

    // Use session hook
    const { session, loading, messages, viewerCount, connectionStatus, sendMessage, joinSession, leaveSession, loadMoreMessages } = useSession(sessionId || '');

    // Message input state
    const [messageInput, setMessageInput] = useState('');

    /**
     * Join session on mount, leave on unmount
     */
    useEffect(() => {
        if (sessionId) {
            joinSession();

            // Log session join
            logEvent('session_joined', {
                sessionId,
                timestamp: new Date().toISOString(),
            });
        }

        return () => {
            if (sessionId) {
                leaveSession();
            }
        };
    }, [sessionId]);

    /**
     * Setup HLS video player
     */
    useEffect(() => {
        if (!session?.video_url || !videoRef.current) {
            return;
        }

        const video = videoRef.current;
        const videoUrl = session.video_url;

        // Check if HLS is supported
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            // Cleanup HLS instance
            return () => {
                hls.destroy();
            };
        }
        // Fallback for Safari (native HLS support)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
        }
    }, [session?.video_url]);

    /**
     * Auto-scroll to bottom when new messages arrive
     */
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    /**
     * Show toast when connection is lost
     */
    useEffect(() => {
        if (connectionStatus === 'disconnected') {
            toast.error('Connection lost', {
                description: 'Attempting to reconnect...',
                duration: Infinity, // Keep showing until reconnected
                id: 'connection-lost', // Prevent duplicate toasts
            });
        } else if (connectionStatus === 'connected') {
            // Dismiss the connection lost toast when reconnected
            toast.dismiss('connection-lost');
        }
    }, [connectionStatus]);

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading session...</p>
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
        <div className="flex h-screen bg-background">
            {/* Left side: Video player area */}
            <div className="flex-1 flex items-center justify-center bg-black">
                <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="w-full h-full"
                />
            </div>

            {/* Right side: Chat sidebar */}
            <div className="w-96 border-l">
                <Card className="h-full rounded-none border-0">
                    <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                {session.title}
                            </CardTitle>
                            <Badge variant="secondary">
                                {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea ref={scrollRef} className="h-full p-4">
                            <div className="space-y-4">
                                {/* Load More button */}
                                {messages.length >= 100 && (
                                    <div className="flex justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadMoreMessages()}
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <div key={message.id} className="flex gap-3">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                                                {message.user_name.charAt(0).toUpperCase()}
                                            </div>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium">
                                                    {message.user_name}
                                                </span>
                                                {message.message_type === 'admin' && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Admin
                                                    </Badge>
                                                )}
                                                {message.is_pinned && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Pinned
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground break-words">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>

                    {/* Message input form */}
                    <div className="border-t p-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();

                                if (!messageInput.trim()) {
                                    return;
                                }

                                sendMessage(messageInput)
                                    .then(() => {
                                        setMessageInput('');
                                    })
                                    .catch((error) => {
                                        toast.error('Failed to send message', {
                                            description: error instanceof Error ? error.message : 'Unknown error',
                                        });
                                    });
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                                disabled={!profile?.is_verified || !session.chat_enabled}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                disabled={!profile?.is_verified || !session.chat_enabled}
                            >
                                Send
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
