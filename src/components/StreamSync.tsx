import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { getLiveOffset } from '@/lib/serverTime';

interface StreamSyncProps {
    /** Reference to the primary video element (screen share) */
    videoRef: RefObject<HTMLVideoElement | null>;
    /** Reference to the secondary video element (face cam) - optional */
    faceVideoRef?: RefObject<HTMLVideoElement | null>;
    /** Scheduled start time from server (ISO 8601) - THE authority */
    scheduledStart: string | null;
    /** Whether the stream is currently live */
    isLive: boolean;
    /** Video duration in seconds (for end detection) */
    videoDuration?: number;
    /** Callback when stream end is detected */
    onStreamEnd?: () => void;
    /** Callback when sync occurs */
    onSync?: (offset: number) => void;
}

/**
 * SIMULIVE SYNC THRESHOLDS
 * These are critical for simulive experience
 */

/** Drift threshold in seconds before sync triggers (500ms for smoother playback) */
const DRIFT_THRESHOLD = 0.5;

/** Minimum time between syncs in milliseconds */
const MIN_SYNC_INTERVAL = 3000;

/** Sync check interval in milliseconds (1 second for smooth playback) */
const CHECK_INTERVAL = 1000;

/**
 * StreamSync Component - SIMULIVE VERSION
 * 
 * Synchronizes video playback with SERVER time (not client time).
 * Supports dual video sync for screen + face cam.
 * 
 * Algorithm:
 * 1. Calculate expected time: SERVER_NOW - scheduled_start
 * 2. Sync if drift >= 250ms
 * 3. Sync both videos together for dual-video mode
 * 4. Handle tab visibility changes
 */
export default function StreamSync({
    videoRef,
    faceVideoRef,
    scheduledStart,
    isLive,
    videoDuration,
    onStreamEnd,
    onSync,
}: StreamSyncProps) {
    const lastSyncTime = useRef<number>(0);
    const checkIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Calculate the expected playback position based on SERVER time
     * This is the authoritative formula for simulive
     */
    const getExpectedTime = useCallback((): number | null => {
        if (!scheduledStart) return null;

        // Use SERVER time, not client time!
        const offset = getLiveOffset(scheduledStart);

        // If negative, stream hasn't started yet
        if (offset < 0) return null;

        return offset;
    }, [scheduledStart]);

    /**
     * Sync a video element to the expected time
     */
    const syncVideoElement = useCallback((
        video: HTMLVideoElement,
        expectedTime: number,
        label: string
    ): boolean => {
        const currentTime = video.currentTime;
        const drift = currentTime - expectedTime;
        const absDrift = Math.abs(drift);

        if (absDrift >= DRIFT_THRESHOLD) {
            console.log(`[StreamSync] Syncing ${label}: current=${currentTime.toFixed(2)}s, expected=${expectedTime.toFixed(2)}s, drift=${drift.toFixed(3)}s`);

            // Seek to expected time
            video.currentTime = expectedTime;
            return true;
        }

        return false;
    }, []);

    /**
     * Sync both videos to expected time
     */
    const syncVideos = useCallback(() => {
        const primaryVideo = videoRef.current;
        if (!primaryVideo || !isLive) return;

        const expectedTime = getExpectedTime();
        if (expectedTime === null) return;

        // Check if video has ended
        if (videoDuration && expectedTime >= videoDuration) {
            console.log('[StreamSync] Stream ended (offset >= duration)');
            onStreamEnd?.();
            return;
        }

        const now = Date.now();
        const timeSinceLastSync = now - lastSyncTime.current;

        // Check if sync is due
        const primaryDrift = Math.abs(primaryVideo.currentTime - expectedTime);
        const needsSync = primaryDrift >= DRIFT_THRESHOLD;

        if (!needsSync) return;

        // Only sync if we haven't synced recently (prevents thrashing)
        if (timeSinceLastSync < MIN_SYNC_INTERVAL) return;

        // Sync primary video (screen share)
        const primarySynced = syncVideoElement(primaryVideo, expectedTime, 'screen');

        // Sync secondary video (face cam) if present
        const faceVideo = faceVideoRef?.current;
        if (faceVideo) {
            // Check face cam drift
            const faceDrift = Math.abs(faceVideo.currentTime - expectedTime);
            if (faceDrift >= DRIFT_THRESHOLD) {
                syncVideoElement(faceVideo, expectedTime, 'face');
            }
        }

        if (primarySynced) {
            lastSyncTime.current = now;
            onSync?.(expectedTime);
        }
    }, [videoRef, faceVideoRef, isLive, getExpectedTime, videoDuration, onStreamEnd, onSync, syncVideoElement]);

    /**
     * Handle visibility change (tab focus/blur)
     * CRITICAL: Force sync when tab becomes visible
     */
    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === 'visible') {
            console.log('[StreamSync] Tab became visible, forcing sync');
            lastSyncTime.current = 0; // Force immediate sync
            syncVideos();
        }
    }, [syncVideos]);

    /**
     * Start continuous sync checking
     */
    useEffect(() => {
        if (!isLive || !scheduledStart) {
            return;
        }

        // Initial sync (immediate)
        syncVideos();

        // Set up interval for continuous sync checks
        checkIntervalId.current = setInterval(syncVideos, CHECK_INTERVAL);

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (checkIntervalId.current) {
                clearInterval(checkIntervalId.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLive, scheduledStart, syncVideos, handleVisibilityChange]);

    // This component doesn't render anything visible
    return null;
}

/**
 * Custom hook version for more flexibility
 */
export function useStreamSync(
    videoRef: RefObject<HTMLVideoElement | null>,
    scheduledStart: string | null,
    isLive: boolean
) {
    const lastSyncTime = useRef<number>(0);

    const getExpectedTime = useCallback((): number | null => {
        if (!scheduledStart) return null;
        const offset = getLiveOffset(scheduledStart);
        return offset >= 0 ? offset : null;
    }, [scheduledStart]);

    const syncVideo = useCallback(() => {
        const video = videoRef.current;
        if (!video || !isLive) return;

        const expectedTime = getExpectedTime();
        if (expectedTime === null) return;

        const drift = Math.abs(video.currentTime - expectedTime);
        const timeSinceLastSync = Date.now() - lastSyncTime.current;

        if (drift >= DRIFT_THRESHOLD || timeSinceLastSync >= MIN_SYNC_INTERVAL) {
            if (video.duration && expectedTime <= video.duration) {
                video.currentTime = expectedTime;
                lastSyncTime.current = Date.now();
            }
        }
    }, [videoRef, isLive, getExpectedTime]);

    useEffect(() => {
        if (!isLive || !scheduledStart) return;

        const interval = setInterval(syncVideo, CHECK_INTERVAL);

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                lastSyncTime.current = 0;
                syncVideo();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [isLive, scheduledStart, syncVideo]);

    return { syncVideo, getExpectedTime };
}
