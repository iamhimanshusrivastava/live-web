import { useState, useEffect, useCallback } from 'react';
import { getLiveOffset, syncServerTime, isServerTimeSynced } from '@/lib/serverTime';

/**
 * Session states for simulive
 */
export type SessionState =
    | 'loading'     // Initial state, fetching data
    | 'scheduled'   // Stream is scheduled but not starting soon
    | 'countdown'   // < 60 seconds to start, show countdown
    | 'starting'    // 0-3 seconds, show "starting" message
    | 'live'        // Stream is playing
    | 'ended'       // Stream has finished
    | 'error';      // Error state

export interface SessionStateInfo {
    state: SessionState;
    /** Seconds until start (negative if started) */
    secondsToStart: number;
    /** Current live offset in seconds (0 if not started) */
    liveOffset: number;
    /** Whether server time is synced */
    isTimeSynced: boolean;
    /** Formatted countdown string */
    countdownDisplay: string;
    /** Formatted duration string */
    durationDisplay: string;
}

interface UseSessionStateOptions {
    /** Scheduled start time (ISO 8601) */
    scheduledStart: string | null;
    /** Video duration in seconds */
    videoDuration: number | null;
    /** Whether session is active (from database) */
    isActive: boolean;
}

/** Countdown threshold in seconds (show countdown when < 60s to start) */
const COUNTDOWN_THRESHOLD = 60;

/** Starting transition duration in seconds */
const STARTING_DURATION = 3;

/**
 * Hook to manage session state for simulive
 * 
 * State machine:
 * - loading: Initial state
 * - scheduled: More than 60s before start
 * - countdown: Less than 60s before start
 * - starting: 0-3 seconds after start time (transition)
 * - live: Playing the stream
 * - ended: Video duration exceeded
 */
export function useSessionState({
    scheduledStart,
    videoDuration,
    isActive,
}: UseSessionStateOptions): SessionStateInfo {
    const [state, setState] = useState<SessionState>('loading');
    const [secondsToStart, setSecondsToStart] = useState<number>(0);
    const [liveOffset, setLiveOffset] = useState<number>(0);
    const [isTimeSynced, setIsTimeSynced] = useState<boolean>(false);

    /**
     * Format seconds as countdown display
     */
    const formatCountdown = useCallback((seconds: number): string => {
        if (seconds <= 0) return '00:00';

        const absSeconds = Math.ceil(seconds);
        const h = Math.floor(absSeconds / 3600);
        const m = Math.floor((absSeconds % 3600) / 60);
        const s = absSeconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    /**
     * Format seconds as duration display (HH:MM:SS)
     */
    const formatDuration = useCallback((seconds: number): string => {
        const absSeconds = Math.max(0, Math.floor(seconds));
        const h = Math.floor(absSeconds / 3600);
        const m = Math.floor((absSeconds % 3600) / 60);
        const s = absSeconds % 60;

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    /**
     * Calculate current state based on server time
     */
    const calculateState = useCallback(() => {
        if (!scheduledStart || !isActive) {
            setState('loading');
            return;
        }

        // Get offset using server time
        const offset = getLiveOffset(scheduledStart);
        setLiveOffset(Math.max(0, offset));
        setSecondsToStart(-offset);
        setIsTimeSynced(isServerTimeSynced());

        // Determine state based on offset
        if (offset < -COUNTDOWN_THRESHOLD) {
            // More than 60s before start
            setState('scheduled');
        } else if (offset < 0) {
            // Less than 60s before start - countdown
            setState('countdown');
        } else if (offset < STARTING_DURATION) {
            // 0-3 seconds after start - transitioning
            setState('starting');
        } else if (videoDuration && offset >= videoDuration) {
            // Past video duration - ended
            setState('ended');
        } else {
            // Stream is live
            setState('live');
        }
    }, [scheduledStart, videoDuration, isActive]);

    /**
     * Initial server time sync
     */
    useEffect(() => {
        syncServerTime().then(() => {
            setIsTimeSynced(true);
            calculateState();
        }).catch(console.error);
    }, []);

    /**
     * Update state every 100ms for smooth countdown
     */
    useEffect(() => {
        if (!scheduledStart || !isActive) return;

        // Initial calculation
        calculateState();

        // Update interval (100ms for smooth countdown)
        const interval = setInterval(calculateState, 100);

        return () => clearInterval(interval);
    }, [scheduledStart, videoDuration, isActive, calculateState]);

    return {
        state,
        secondsToStart,
        liveOffset,
        isTimeSynced,
        countdownDisplay: formatCountdown(secondsToStart),
        durationDisplay: formatDuration(liveOffset),
    };
}

/**
 * Check if session should show video player
 */
export function shouldShowPlayer(state: SessionState): boolean {
    return state === 'live';
}

/**
 * Check if session should show countdown
 */
export function shouldShowCountdown(state: SessionState): boolean {
    return state === 'scheduled' || state === 'countdown';
}

/**
 * Check if session should show starting message
 */
export function shouldShowStarting(state: SessionState): boolean {
    return state === 'starting';
}

/**
 * Check if session has ended
 */
export function shouldShowEnded(state: SessionState): boolean {
    return state === 'ended';
}
