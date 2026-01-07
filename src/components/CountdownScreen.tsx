import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CountdownScreenProps {
    /** Session title */
    title: string;
    /** Session topic/description */
    topic?: string;
    /** Seconds until start (positive) */
    secondsToStart: number;
    /** Formatted countdown display */
    countdownDisplay: string;
    /** Whether in immediate countdown (< 60s) */
    isImminent: boolean;
}

/**
 * CountdownScreen Component
 * Shows before scheduled start time with live countdown
 * 
 * UI Requirements:
 * - Stream title and topic
 * - Real-time countdown (server-driven)
 * - Visual distinction between scheduled vs imminent
 */
export default function CountdownScreen({
    title,
    topic,
    secondsToStart,
    countdownDisplay,
    isImminent,
}: CountdownScreenProps) {
    // Pulsing animation for imminent countdown
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        if (isImminent && secondsToStart <= 10) {
            // Pulse every second in last 10 seconds
            const interval = setInterval(() => {
                setPulse(prev => !prev);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isImminent, secondsToStart]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
            <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
                <CardContent className="p-8 text-center space-y-8">
                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white">
                            {title}
                        </h1>
                        {topic && (
                            <p className="text-lg text-zinc-400">
                                {topic}
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-16 h-px bg-zinc-700 mx-auto" />

                    {/* Countdown */}
                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-widest text-zinc-500">
                            {isImminent ? 'Starting in' : 'Scheduled to start in'}
                        </p>

                        <div
                            className={`text-6xl font-mono font-bold transition-all duration-300 ${isImminent
                                    ? pulse
                                        ? 'text-red-500 scale-105'
                                        : 'text-red-400 scale-100'
                                    : 'text-white'
                                }`}
                        >
                            {countdownDisplay}
                        </div>

                        {/* Progress indicator for imminent */}
                        {isImminent && (
                            <div className="w-64 h-1 bg-zinc-800 mx-auto rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                                    style={{
                                        width: `${Math.max(0, (60 - secondsToStart) / 60 * 100)}%`
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Info message */}
                    <p className="text-sm text-zinc-500">
                        {isImminent
                            ? 'Please stay on this page. The session will start automatically.'
                            : 'The session will begin at the scheduled time.'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
