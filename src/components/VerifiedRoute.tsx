import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Verified route component
 * Redirects to verify-email if user is not verified
 * Should be used in combination with ProtectedRoute
 */
export default function VerifiedRoute({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();

    // Show loading state while checking verification
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    // Redirect to verify-email if not verified
    if (!profile?.is_verified) {
        return <Navigate to="/verify-email" replace />;
    }

    // Render children if verified
    return <>{children}</>;
}
