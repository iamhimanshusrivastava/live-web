import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import VerifiedRoute from '@/components/VerifiedRoute';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import SessionsListPage from '@/pages/SessionsListPage';
import SessionPage from '@/pages/SessionPage';
import AdminDashboard from '@/pages/AdminDashboard';

/**
 * Main application component
 * Sets up routing and authentication context
 */
export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />

                    {/* Protected routes (require authentication) */}
                    <Route
                        path="/verify-email"
                        element={
                            <ProtectedRoute>
                                <VerifyEmailPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected + Verified routes */}
                    <Route
                        path="/sessions"
                        element={
                            <ProtectedRoute>
                                <VerifiedRoute>
                                    <SessionsListPage />
                                </VerifiedRoute>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/session/:sessionId"
                        element={
                            <ProtectedRoute>
                                <VerifiedRoute>
                                    <SessionPage />
                                </VerifiedRoute>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/:sessionId"
                        element={
                            <ProtectedRoute>
                                <VerifiedRoute>
                                    <AdminDashboard />
                                </VerifiedRoute>
                            </ProtectedRoute>
                        }
                    />

                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/sessions" replace />} />
                </Routes>
                <Toaster />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;