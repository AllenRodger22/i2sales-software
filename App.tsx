import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth';
import RouteGuard from './components/RouteGuard';
import LoginPage from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import RegisterPage from './pages/Register';
import UpdatePasswordPage from './pages/UpdatePassword';
import ForgotPasswordPage from './pages/ForgotPassword';

const AppContent = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route
                path="/dashboard/*"
                element={
                    <RouteGuard>
                        <DashboardRouter />
                    </RouteGuard>
                }
            />
            <Route path="*" element={<LoginPage />} />
        </Routes>
    );
};

export default function App() {
  return (
    <HashRouter>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </HashRouter>
  );
}
