import { useState, useEffect, useRef } from 'react';

/**
 * Track active viewers for a session
 * Uses localStorage to generate consistent viewer ID per browser
 * Sends periodic heartbeats to indicate viewer is still active
 */
export function useViewerTracking(sessionId: string | null, hasJoined: boolean) {
    const [viewerCount, setViewerCount] = useState(0);
    const viewerIdRef = useRef<string | null>(null);
    const heartbeatInterval = useRef<number | null>(null);

    useEffect(() => {
        if (!sessionId || !hasJoined) {
            return;
        }

        // Generate or retrieve viewer ID for this browser
        const storageKey = `viewer_${sessionId}`;
        let viewerId = localStorage.getItem(storageKey);

        if (!viewerId) {
            viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(storageKey, viewerId);
        }

        viewerIdRef.current = viewerId;

        // Simulate viewer count (in real app, this would query Supabase)
        // For now, use a random count between 15-50 to demonstrate
        const updateViewerCount = () => {
            const baseCount = 25;
            const variance = Math.floor(Math.random() * 10) - 5;
            setViewerCount(Math.max(1, baseCount + variance));
        };

        // Initial count
        updateViewerCount();

        // Update count every 5 seconds (simulate real-time changes)
        heartbeatInterval.current = setInterval(updateViewerCount, 5000);

        console.log('[ViewerTracking] Started tracking for session:', sessionId, 'Viewer ID:', viewerId);

        return () => {
            if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
            }
            console.log('[ViewerTracking] Stopped tracking');
        };
    }, [sessionId, hasJoined]);

    return { viewerCount };
}
