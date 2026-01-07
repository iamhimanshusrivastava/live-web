import { Card, CardContent } from '@/components/ui/card';

interface SessionEndedScreenProps {
    /** Session title */
    title: string;
}

/**
 * SessionEndedScreen Component
 * Shows when video duration is exceeded
 * 
 * Requirements:
 * - No replay option
 * - No controls
 * - No chat continuation
 */
export default function SessionEndedScreen({ title }: SessionEndedScreenProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
            <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800">
                <CardContent className="p-8 text-center space-y-6">
                    {/* Ended icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-white">
                            This session has ended.
                        </h2>
                        <p className="text-sm text-zinc-400">
                            {title}
                        </p>
                    </div>

                    {/* Info */}
                    <p className="text-xs text-zinc-500">
                        Thank you for attending.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
