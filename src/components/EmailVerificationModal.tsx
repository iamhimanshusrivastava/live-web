import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EmailVerificationModalProps {
    /** Whether modal is open */
    isOpen: boolean;
    /** Session title for context */
    sessionTitle?: string;
    /** Error message to display */
    error?: string | null;
    /** Loading state */
    loading?: boolean;
    /** Callback when email is submitted */
    onSubmit: (email: string) => Promise<boolean>;
}

/**
 * Email Verification Modal
 * Shown when user needs to authenticate via Codekaro email
 */
export default function EmailVerificationModal({
    isOpen,
    sessionTitle,
    error,
    loading = false,
    onSubmit,
}: EmailVerificationModalProps) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        // Validate email format
        if (!email.trim()) {
            setLocalError('Please enter your email');
            return;
        }

        if (!email.includes('@')) {
            setLocalError('Please enter a valid email address');
            return;
        }

        setSubmitting(true);

        try {
            const success = await onSubmit(email.trim().toLowerCase());
            if (!success) {
                // Error will be set by parent
            }
        } finally {
            setSubmitting(false);
        }
    };

    const displayError = error || localError;
    const isLoading = loading || submitting;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md bg-zinc-900 border-zinc-800"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-white">
                        Enter Your Email
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {sessionTitle
                            ? `To access "${sessionTitle}", please verify your Codekaro email.`
                            : 'Please enter your registered Codekaro email to continue.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            autoFocus
                        />

                        {displayError && (
                            <p className="text-sm text-red-400">
                                {displayError}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                Verifying...
                            </span>
                        ) : (
                            'Continue'
                        )}
                    </Button>
                </form>

                <p className="text-xs text-zinc-500 text-center mt-2">
                    Use the email registered with your Codekaro account.
                </p>
            </DialogContent>
        </Dialog>
    );
}
