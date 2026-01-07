/**
 * Codekaro API Service
 * External API integration for batch/event data and user authentication
 */

const CODEKARO_API_BASE = 'https://codekaro.in/api';

/**
 * Batch/Event data from Codekaro API
 */
export interface CodekaroBatch {
    id: string;
    title: string;
    time: string;
    topic: string;
    url: string;         // Face cam HLS URL
    screenUrl: string;   // Screen share HLS URL
    description?: string;
}

/**
 * User data from Codekaro API
 */
export interface CodekaroUser {
    name: string;
    email: string;
    avatar: string;
    error?: string;
}

/**
 * Fetch batch/event details by ID
 * @param batchId - The batch/event ID
 * @returns Batch data or null if not found
 */
export async function getBatch(batchId: string): Promise<CodekaroBatch | null> {
    try {
        const response = await fetch(`${CODEKARO_API_BASE}/batch/${batchId}`);

        if (!response.ok) {
            console.error('Failed to fetch batch:', response.status);
            return null;
        }

        const data = await response.json();
        return data as CodekaroBatch;
    } catch (error) {
        console.error('Error fetching batch:', error);
        return null;
    }
}

/**
 * Fetch user details by email
 * @param email - User's email address
 * @returns User data or null if not found
 */
export async function getUser(email: string): Promise<CodekaroUser | null> {
    try {
        const response = await fetch(`${CODEKARO_API_BASE}/user/${encodeURIComponent(email)}`);

        if (!response.ok) {
            console.error('Failed to fetch user:', response.status);
            return null;
        }

        const data = await response.json();

        // Check for error response
        if (data.error) {
            console.error('User not found:', data.error);
            return null;
        }

        return data as CodekaroUser;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Validate if a batch/event exists and has stream URLs
 * @param batchId - The batch/event ID
 * @returns true if valid stream exists
 */
export async function validateBatch(batchId: string): Promise<boolean> {
    const batch = await getBatch(batchId);
    return !!(batch && (batch.url || batch.screenUrl));
}

/**
 * Storage key for user session in localStorage
 */
export const CK_USER_STORAGE_KEY = 'ck_stream_user';

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): CodekaroUser | null {
    try {
        const stored = localStorage.getItem(CK_USER_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as CodekaroUser;
        }
    } catch {
        console.error('Failed to parse stored user');
    }
    return null;
}

/**
 * Store user in localStorage
 */
export function storeUser(user: CodekaroUser): void {
    localStorage.setItem(CK_USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Clear stored user from localStorage
 */
export function clearStoredUser(): void {
    localStorage.removeItem(CK_USER_STORAGE_KEY);
}
