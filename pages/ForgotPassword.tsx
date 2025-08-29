import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { sendPasswordResetEmail, state } = useAuth();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    if (!email) {
      setLocalError('Por favor, digite seu e-mail.');
      return;
    }
    try {
      await sendPasswordResetEmail(email);
      setSuccessMessage('Se uma conta existir para este e-mail, um link para redefinir a senha foi enviado.');
    } catch (err: any) {
      setLocalError(err.message || 'Falha ao enviar o e-mail de redefinição.');
    }
  };

  const isFormDisabled = state === 'loading' || !!successMessage;

  return (
    <div className="auth-forest flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 glass-strong">
        <div>
          <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
            Redefinir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Digite seu email para receber o link de redefinição.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-glass"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={isFormDisabled} className="btn btn-primary w-full">
            {state === 'loading' ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </button>
        </form>
        {localError && <p className="mt-4 text-sm text-red-400 text-center">{localError}</p>}
        {successMessage && <p className="mt-4 text-sm text-green-400 text-center">{successMessage}</p>}
        <p className="mt-6 text-center text-sm text-gray-400">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-medium text-orange-400 hover:text-orange-300">
            Voltar para o Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
