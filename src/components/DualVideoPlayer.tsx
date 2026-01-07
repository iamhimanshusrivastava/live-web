import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import StreamSync from './StreamSync';

interface DualVideoPlayerProps {
    /** Screen share video URL (main video) */
    screenUrl: string | null;
    /** Face cam video URL (PiP video) */
    faceUrl: string | null;
    /** Scheduled start time for synchronization */
    scheduledStart: string;
    /** Whether stream is currently live */
    isLive: boolean;
    /** Video duration for end detection */
    videoDuration?: number;
    /** Callback when stream ends */
    onStreamEnd?: () => void;
    /** Current live offset display */
    liveOffset?: number;
}

/**
 * DualVideoPlayer Component - SIMULIVE
 * 
 * Plays two synchronized videos:
 * - Screen share (main, full screen)
 * - Face cam (Picture-in-Picture, bottom-right corner)
 * 
 * CRITICAL:
 * - No controls visible (pause, seek, speed, mute disabled)
 * - Both videos synchronized to server time
 * - Videos start at live_offset, not beginning
 */
export default function DualVideoPlayer({
    screenUrl,
    faceUrl,
    scheduledStart,
    isLive,
    videoDuration,
    onStreamEnd,
    liveOffset,
}: DualVideoPlayerProps) {
    // Video refs
    const screenRef = useRef<HTMLVideoElement>(null);
    const faceRef = useRef<HTMLVideoElement>(null);

    // HLS instances
    const screenHls = useRef<Hls | null>(null);
    const faceHls = useRef<Hls | null>(null);

    // PiP state
    const [pipPosition, setPipPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
    const [pipVisible, setPipVisible] = useState(true);

    /**
     * Initialize HLS player for a video element
     */
    const initHls = useCallback((
        url: string,
        videoElement: HTMLVideoElement,
        label: string
    ): Hls | null => {
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });

            hls.loadSource(url);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log(`[DualVideo] ${label} manifest loaded`);
                videoElement.play().catch(console.error);
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    console.error(`[DualVideo] ${label} fatal error:`, data.type);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    }
                }
            });

            return hls;
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            videoElement.src = url;
            videoElement.play().catch(console.error);
            return null;
        }

        return null;
    }, []);

    /**
     * Setup screen video
     */
    useEffect(() => {
        if (!screenUrl || !screenRef.current) return;

        screenHls.current = initHls(screenUrl, screenRef.current, 'screen');

        return () => {
            if (screenHls.current) {
                screenHls.current.destroy();
                screenHls.current = null;
            }
        };
    }, [screenUrl, initHls]);

    /**
     * Setup face video
     */
    useEffect(() => {
        if (!faceUrl || !faceRef.current) return;

        faceHls.current = initHls(faceUrl, faceRef.current, 'face');

        return () => {
            if (faceHls.current) {
                faceHls.current.destroy();
                faceHls.current = null;
            }
        };
    }, [faceUrl, initHls]);

    /**
     * Enforce unmuted state on both videos (initial setup only)
     * Set at mount and when videos change
     */
    useEffect(() => {
        const screenVideo = screenRef.current;
        const faceVideo = faceRef.current;

        if (screenVideo) {
            screenVideo.muted = false;
        }

        if (faceVideo) {
            faceVideo.muted = false;
        }
    }, [screenUrl, faceUrl]);

    /**
     * Toggle PiP position
     */
    const cyclePipPosition = () => {
        const positions: typeof pipPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
        const currentIndex = positions.indexOf(pipPosition);
        setPipPosition(positions[(currentIndex + 1) % positions.length]);
    };

    /**
     * Get PiP position styles
     */
    const getPipStyles = () => {
        const base = 'absolute w-64 h-40 rounded-lg overflow-hidden shadow-2xl transition-all duration-300';
        switch (pipPosition) {
            case 'bottom-right':
                return `${base} bottom-4 right-4`;
            case 'bottom-left':
                return `${base} bottom-4 left-4`;
            case 'top-right':
                return `${base} top-4 right-4`;
            case 'top-left':
                return `${base} top-4 left-4`;
        }
    };

    return (
        <div className="relative w-full h-full bg-black">
            {/* StreamSync - synchronizes both videos */}
            <StreamSync
                videoRef={screenRef}
                faceVideoRef={faceRef}
                scheduledStart={scheduledStart}
                isLive={isLive}
                videoDuration={videoDuration}
                onStreamEnd={onStreamEnd}
            />

            {/* Main video (screen share) - NO CONTROLS */}
            <video
                ref={screenRef}
                autoPlay
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                controlsList="nodownload nofullscreen noremoteplayback"
                className="w-full h-full object-contain pointer-events-none"
                style={{
                    // Disable all native controls
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                }}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* PiP video (face cam) */}
            {faceUrl && pipVisible && (
                <div
                    className={getPipStyles()}
                    onClick={cyclePipPosition}
                    title="Click to move"
                >
                    <video
                        ref={faceRef}
                        autoPlay
                        playsInline
                        disablePictureInPicture
                        disableRemotePlayback
                        controlsList="nodownload nofullscreen noremoteplayback"
                        className="w-full h-full object-cover pointer-events-none"
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    {/* Close button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPipVisible(false);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Show PiP button if hidden */}
            {faceUrl && !pipVisible && (
                <button
                    onClick={() => setPipVisible(true)}
                    className="absolute bottom-4 right-4 px-3 py-2 bg-black/50 hover:bg-black/70 rounded-lg text-white text-sm transition-colors"
                >
                    Show Face Cam
                </button>
            )}

            {/* Live offset indicator (debug) */}
            {liveOffset !== undefined && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white/70 font-mono">
                    Offset: {liveOffset.toFixed(1)}s
                </div>
            )}
        </div>
    );
}
