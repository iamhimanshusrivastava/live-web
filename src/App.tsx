import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import SessionsListPage from '@/pages/SessionsListPage';
import SessionPage from '@/pages/SessionPage';
import AdminDashboard from '@/pages/AdminDashboard';

/**
 * Main application component
 * Sets up routing and authentication context
 * Uses email-only authentication via Codekaro API
 */
export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected routes (require Codekaro email auth) */}
                    <Route
                        path="/sessions"
                        element={
                            <ProtectedRoute>
                                <SessionsListPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/session/:sessionId"
                        element={
                            <ProtectedRoute>
                                <SessionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/:sessionId"
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/sessions" replace />} />

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/sessions" replace />} />
                </Routes>
                <Toaster />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;