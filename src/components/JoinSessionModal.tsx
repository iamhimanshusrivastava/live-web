import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface JoinSessionModalProps {
    isOpen: boolean;
    sessionTitle: string;
    userName: string;
    onJoin: () => void;
}

/**
 * Join Session Modal
 * Shows for all users (new and verified) before loading videos
 * Provides required user interaction for audio autoplay
 */
export default function JoinSessionModal({
    isOpen,
    sessionTitle,
    userName,
    onJoin,
}: JoinSessionModalProps) {
    return (
        <Dialog open={isOpen} modal>
            <DialogContent
                className="sm:max-w-md"
                showCloseButton={false}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl">Ready to join?</DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        {sessionTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                Joining as
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                {userName}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={onJoin}
                        size="lg"
                        className="w-full bg-indigo-600 hover:bg-indigo-500"
                    >
                        Join Session
                    </Button>

                    <p className="text-xs text-center text-zinc-500">
                        Click to join with audio enabled
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
