import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
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
            path="/"
            element={
              <AuthGate>
                <DashboardPage />
              </AuthGate>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

