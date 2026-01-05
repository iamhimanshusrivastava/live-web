import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Email verification page component
 * Allows users to verify their account using an external system ID
 */
export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const { user, verifyEmail } = useAuth();

    // Form state
    const [externalId, setExternalId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    /**
     * Handle verification submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const verified = await verifyEmail(externalId);

            if (verified) {
                setSuccess(true);
                toast.success('Verification successful!', {
                    description: 'Redirecting to sessions...',
                });
                // Navigate to sessions after a brief delay
                setTimeout(() => {
                    navigate('/sessions');
                }, 2000);
            } else {
                toast.error('Verification failed', {
                    description: 'Please check your External System ID and try again.',
                });
            }
        } catch (err) {
            toast.error('Verification failed', {
                description: err instanceof Error ? err.message : 'An unexpected error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    // Show success message
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-center text-green-600">
                            Verification Successful!
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            Your account has been verified. Redirecting to sessions...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-center">
                        Verify Your Account
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                            Account Email
                        </p>
                        <p className="font-medium">
                            {user?.email || 'No email found'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="externalId" className="text-sm font-medium">
                                External System ID
                            </label>
                            <Input
                                id="externalId"
                                type="text"
                                placeholder="Enter your ID from c.com"
                                value={externalId}
                                onChange={(e) => setExternalId(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your external system ID to verify your account
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
