import { useParams } from 'react-router-dom';
import { Eye, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBatchSession } from '@/hooks/useBatchSession';
import { useSessionState } from '@/hooks/useSessionState';
import DualVideoPlayer from '@/components/DualVideoPlayer';
import EmailVerificationModal from '@/components/EmailVerificationModal';

/**
 * Admin Dashboard
 * Simplified for Codekaro batch integration
 * Shows video player with basic session info
 */
export default function AdminDashboard() {
    const { sessionId } = useParams<{ sessionId: string }>();

    // Codekaro batch session
    const {
        session,
        user,
        loading,
        error,
        showEmailModal,
        verifyEmail,
    } = useBatchSession(sessionId || '');

    // Session state machine
    const {
        state: sessionState,
        liveOffset,
        durationDisplay,
    } = useSessionState({
        scheduledStart: session?.scheduledStart?.toISOString() || null,
        videoDuration: null,
        isActive: !!session?.isValid,
    });

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                    <p className="text-zinc-400">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    // Session not found
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
                {/* Left: Video Player */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                                ADMIN
                            </Badge>
                            <h1 className="text-white text-lg font-semibold">
                                {session.title}
                            </h1>
                        </div>
                        {user && (
                            <span className="text-zinc-400 text-sm">
                                {user.name}
                            </span>
                        )}
                    </div>

                    {/* Video Player */}
                    <div className="flex-1">
                        {sessionState === 'live' ? (
                            <DualVideoPlayer
                                screenUrl={session.screenUrl}
                                faceUrl={session.faceUrl}
                                scheduledStart={session.scheduledStart.toISOString()}
                                isLive={true}
                                liveOffset={liveOffset}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-zinc-900">
                                <div className="text-center space-y-4">
                                    <h2 className="text-xl font-semibold text-white">
                                        {sessionState === 'scheduled' && 'Session Not Started'}
                                        {sessionState === 'countdown' && 'Starting Soon...'}
                                        {sessionState === 'starting' && 'Starting...'}
                                        {sessionState === 'ended' && 'Session Ended'}
                                    </h2>
                                    <p className="text-zinc-400">
                                        {durationDisplay}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Stats & Info */}
                <div className="w-96 border-l border-zinc-800 bg-zinc-900">
                    <div className="p-6 space-y-6">
                        {/* Session Info */}
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader>
                                <CardTitle className="text-white text-sm">
                                    Session Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400 text-sm">Topic</span>
                                    <Badge variant="secondary">{session.topic}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400 text-sm">Batch ID</span>
                                    <code className="text-xs text-zinc-300 bg-zinc-700 px-2 py-1 rounded">
                                        {session.id}
                                    </code>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400 text-sm">Status</span>
                                    <Badge variant={sessionState === 'live' ? 'destructive' : 'outline'}>
                                        {sessionState.toUpperCase()}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live Stats */}
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader>
                                <CardTitle className="text-white text-sm">
                                    Live Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Eye className="h-5 w-5 text-zinc-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">-</p>
                                        <p className="text-xs text-zinc-500">Viewers</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-zinc-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">-</p>
                                        <p className="text-xs text-zinc-500">Messages</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Video URLs */}
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader>
                                <CardTitle className="text-white text-sm">
                                    Video Sources
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Screen Share</p>
                                    <code className="text-xs text-zinc-300 break-all">
                                        {session.screenUrl || 'Not available'}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Face Cam</p>
                                    <code className="text-xs text-zinc-300 break-all">
                                        {session.faceUrl || 'Not available'}
                                    </code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
