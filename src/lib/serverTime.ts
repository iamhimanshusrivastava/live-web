/**
 * Server Time Utility
 * Provides authoritative server time for simulive synchronization
 * 
 * CRITICAL: Client clocks cannot be trusted for simulive.
 * All time calculations must use server time.
 */

/** Server time offset (server - client) in milliseconds */
let serverTimeOffset = 0;

/** Whether server time has been synced */
let isSynced = false;

/** Last sync timestamp */
let lastSyncTime = 0;

/** Sync interval in milliseconds (5 minutes) */
const SYNC_INTERVAL = 5 * 60 * 1000;

/** Supabase project URL for time endpoint */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Fetch server time from Supabase
 * Uses a lightweight RPC call to get PostgreSQL NOW()
 */
async function fetchServerTime(): Promise<number> {
    try {
        // Option 1: Use Supabase REST API with a simple query
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_server_time`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`Server time fetch failed: ${response.status}`);
        }

        const data = await response.json();
        return new Date(data).getTime();
    } catch (error) {
        console.warn('[ServerTime] Failed to fetch server time, using client time:', error);
        // Fallback to client time (not ideal, but prevents crashes)
        return Date.now();
    }
}

/**
 * Sync with server time
 * Calculates the offset between server and client clocks
 */
export async function syncServerTime(): Promise<void> {
    const clientBefore = Date.now();
    const serverTime = await fetchServerTime();
    const clientAfter = Date.now();

    // Estimate network latency (round-trip / 2)
    const latency = (clientAfter - clientBefore) / 2;

    // Calculate offset: server time - client time (adjusted for latency)
    serverTimeOffset = serverTime - (clientBefore + latency);
    isSynced = true;
    lastSyncTime = Date.now();

    console.log(`[ServerTime] Synced. Offset: ${serverTimeOffset}ms, Latency: ${latency}ms`);
}

/**
 * Get current server time
 * Returns server-adjusted timestamp
 */
export function getServerTime(): number {
    // Auto-sync if never synced or stale
    if (!isSynced || Date.now() - lastSyncTime > SYNC_INTERVAL) {
        // Trigger async sync (don't await to avoid blocking)
        syncServerTime().catch(console.error);
    }

    return Date.now() + serverTimeOffset;
}

/**
 * Calculate live offset in seconds
 * @param scheduledStart - ISO 8601 scheduled start time
 * @returns Offset in seconds (negative if before start)
 */
export function getLiveOffset(scheduledStart: string): number {
    const startTime = new Date(scheduledStart).getTime();
    const serverNow = getServerTime();
    return (serverNow - startTime) / 1000;
}

/**
 * Check if we're synced with server time
 */
export function isServerTimeSynced(): boolean {
    return isSynced;
}

/**
 * Get the current server time offset
 */
export function getServerTimeOffset(): number {
    return serverTimeOffset;
}

/**
 * Initialize server time on app startup
 * Call this early in the app lifecycle
 */
export async function initServerTime(): Promise<void> {
    await syncServerTime();

    // Re-sync periodically
    setInterval(() => {
        syncServerTime().catch(console.error);
    }, SYNC_INTERVAL);
}

/**
 * Format seconds as HH:MM:SS
 */
export function formatDuration(seconds: number): string {
    const absSeconds = Math.abs(Math.floor(seconds));
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format countdown with days if needed
 */
export function formatCountdown(seconds: number): string {
    if (seconds <= 0) return '00:00:00';

    const days = Math.floor(seconds / 86400);
    const remaining = seconds % 86400;

    if (days > 0) {
        return `${days}d ${formatDuration(remaining)}`;
    }

    return formatDuration(remaining);
}
