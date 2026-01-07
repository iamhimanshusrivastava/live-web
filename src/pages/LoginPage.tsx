import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { logEvent } from '@/lib/analytics';

/**
 * Login page component
 * Email-only authentication via Codekaro API
 */
export default function LoginPage() {
    const navigate = useNavigate();
    const { loginWithEmail, isAuthenticated } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/sessions');
        return null;
    }

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter your email');
            return;
        }

        setLoading(true);

        try {
            await loginWithEmail(email.trim());

            // Log successful login
            logEvent('user_login', {
                email: email.trim(),
                authMethod: 'codekaro',
                timestamp: new Date().toISOString(),
            });

            toast.success('Welcome!', {
                description: 'You have been logged in successfully.',
            });

            navigate('/sessions');
        } catch (error) {
            toast.error('Login failed', {
                description: error instanceof Error ? error.message : 'User not found. Please check your email.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-semibold">
                        Welcome to Live Stream
                    </CardTitle>
                    <CardDescription>
                        Enter your email to join the session
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                Use your Codekaro registered email address
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !email.trim()}
                        >
                            {loading ? 'Verifying...' : 'Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

