import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import BrokerDashboard from './pages/BrokerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AuthGate from './auth/AuthGate';
import { AuthProvider } from './auth/useAuth';

// Rotas do aplicativo (v6+)
// - /login: tela pública
// - /: protegida, envolve Dashboard com AuthGate
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/broker/dashboard"
            element={
              <AuthGate>
                <BrokerDashboard />
              </AuthGate>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <AuthGate>
                <ManagerDashboard />
              </AuthGate>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

