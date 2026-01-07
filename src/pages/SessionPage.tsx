import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBatchSession } from '@/hooks/useBatchSession';
import { useSessionState, shouldShowCountdown, shouldShowStarting, shouldShowEnded } from '@/hooks/useSessionState';
import { initServerTime } from '@/lib/serverTime';
import DualVideoPlayer from '@/components/DualVideoPlayer';
import CountdownScreen from '@/components/CountdownScreen';
import StartingScreen from '@/components/StartingScreen';
import SessionEndedScreen from '@/components/SessionEndedScreen';
import EmailVerificationModal from '@/components/EmailVerificationModal';

// Temporary in-memory chat (will be replaced with Supabase realtime)
interface ChatMessage {
    id: string;
    userName: string;
    content: string;
    timestamp: Date;
    isAdmin?: boolean;
}

/**
 * SessionPage - SIMULIVE with Codekaro Integration
 * 
 * Uses Codekaro batch ID directly (not Supabase UUID)
 * Shows email modal for authentication
 */
export default function SessionPage() {
    const { sessionId } = useParams<{ sessionId: string }>();

    // Codekaro batch session
    const {
        session,
        user,
        loading,
        error,
        isAuthenticated,
        showEmailModal,
        verifyEmail,
    } = useBatchSession(sessionId || '');

    // Session state machine
    const {
        state: sessionState,
        secondsToStart,
        liveOffset,
        countdownDisplay,
        durationDisplay,
        isTimeSynced,
    } = useSessionState({
        scheduledStart: session?.scheduledStart?.toISOString() || null,
        videoDuration: null,
        isActive: !!session?.isValid,
    });

    // Chat state (in-memory for now)
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    /**
     * Initialize server time on mount
     */
    useEffect(() => {
        initServerTime().catch(console.error);
    }, []);

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
     * Send a chat message
     */
    const sendMessage = () => {
        if (!messageInput.trim() || !user) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            userName: user.name,
            content: messageInput.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                    <p className="text-zinc-400">Loading session...</p>
                </div>
            </div>
        );
    }

    // Session not found or error
    if (error || !session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">Session Not Found</h1>
                    <p className="text-zinc-400">{error || 'The requested session does not exist.'}</p>
                    <p className="text-sm text-zinc-500">Session ID: {sessionId}</p>
                </div>
            </div>
        );
    }

    // Show countdown screen (before stream starts)
    if (shouldShowCountdown(sessionState)) {
        return (
            <>
                <EmailVerificationModal
                    isOpen={showEmailModal}
                    sessionTitle={session.title}
                    error={error}
                    onSubmit={verifyEmail}
                />
                <CountdownScreen
                    title={session.title}
                    topic={session.topic}
                    secondsToStart={secondsToStart}
                    countdownDisplay={countdownDisplay}
                    isImminent={sessionState === 'countdown'}
                />
            </>
        );
    }

    // Show starting screen (0-3 seconds transition)
    if (shouldShowStarting(sessionState)) {
        return (
            <>
                <EmailVerificationModal
                    isOpen={showEmailModal}
                    sessionTitle={session.title}
                    error={error}
                    onSubmit={verifyEmail}
                />
                <StartingScreen title={session.title} />
            </>
        );
    }

    // Show ended screen
    if (shouldShowEnded(sessionState)) {
        return <SessionEndedScreen title={session.title} />;
    }

    // LIVE STATE - Show video player + chat
    return (
        <>
            {/* Email verification modal */}
            <EmailVerificationModal
                isOpen={showEmailModal}
                sessionTitle={session.title}
                error={error}
                onSubmit={verifyEmail}
            />

            <div className="flex h-screen bg-black">
                {/* Left side: Video player area */}
                <div className="flex-1 flex flex-col">
                    {/* Stream info bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Badge variant="destructive" className="animate-pulse">
                                🔴 LIVE
                            </Badge>
                            <span className="text-white text-sm font-mono">
                                {durationDisplay}
                            </span>
                            {!isTimeSynced && (
                                <span className="text-yellow-500 text-xs">
                                    Syncing...
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {user && (
                                <span className="text-zinc-400 text-sm">
                                    {user.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dual video player */}
                    <div className="flex-1">
                        <DualVideoPlayer
                            screenUrl={session.screenUrl}
                            faceUrl={session.faceUrl}
                            scheduledStart={session.scheduledStart.toISOString()}
                            isLive={true}
                            liveOffset={liveOffset}
                        />
                    </div>
                </div>

                {/* Right side: Chat sidebar */}
                <div className="w-96 border-l border-zinc-800 bg-background">
                    <Card className="h-full rounded-none border-0 flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    {session.title}
                                </CardTitle>
                                <Badge variant="secondary">
                                    {session.topic}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <ScrollArea ref={scrollRef} className="h-full p-4">
                                <div className="space-y-4">
                                    {messages.length === 0 && (
                                        <p className="text-center text-zinc-500 text-sm py-8">
                                            No messages yet. Be the first to say hello!
                                        </p>
                                    )}

                                    {messages.map((message) => (
                                        <div key={message.id} className="flex gap-3">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                                                    {message.userName.charAt(0).toUpperCase()}
                                                </div>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {message.userName}
                                                    </span>
                                                    {message.isAdmin && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Admin
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
                            {isAuthenticated ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        sendMessage();
                                    }}
                                    className="flex gap-2"
                                >
                                    <Input
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1"
                                    />
                                    <Button type="submit">
                                        Send
                                    </Button>
                                </form>
                            ) : (
                                <p className="text-center text-zinc-500 text-sm">
                                    Enter your email to chat
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
