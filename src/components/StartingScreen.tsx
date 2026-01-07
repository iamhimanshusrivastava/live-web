import { Card, CardContent } from '@/components/ui/card';

interface StartingScreenProps {
    /** Session title */
    title: string;
}

/**
 * StartingScreen Component
 * Shows briefly (0-3 seconds) when stream is starting
 */
export default function StartingScreen({ title }: StartingScreenProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
            <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800">
                <CardContent className="p-8 text-center space-y-6">
                    {/* Loading animation */}
                    <div className="flex justify-center">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-zinc-700 rounded-full" />
                            <div className="absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin" />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-white">
                            Please wait, the session is starting...
                        </h2>
                        <p className="text-sm text-zinc-400">
                            {title}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
