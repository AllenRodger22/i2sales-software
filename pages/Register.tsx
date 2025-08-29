import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Role } from '../types';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.BROKER);
    const { register, state } = useAuth();
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setSuccessMessage(null);

        if (!name || !email || !password || !role) {
            setLocalError('Todos os campos são obrigatórios.');
            return;
        }

        try {
            const { confirmationSent } = await register(name, email, password, role);

            if (confirmationSent) {
                setSuccessMessage('Conta criada! Por favor, verifique seu e-mail para confirmar sua conta antes de fazer login.');
            } else {
                setSuccessMessage('Conta criada com sucesso! Redirecionando para o login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err: any) {
             if (err.message && err.message.toLowerCase().includes('email already exists')) {
                setLocalError('Um usuário com este e-mail já existe.');
            } else {
                setLocalError(err.message || 'Falha ao registrar.');
            }
        }
    };

    const inputClass = "input-glass";
    const isLoading = state === 'loading';

    return (
        <div className="auth-forest flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-8 glass-strong">
                <div>
                    <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white">
                        Criar Nova Conta
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-300">
                        Preencha os dados para se registrar
                    </p>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        className={inputClass}
                        placeholder="Nome Completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className={inputClass}
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className={inputClass}
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <select
                        id="role"
                        name="role"
                        required
                        className={inputClass}
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                    >
                        <option value={Role.BROKER} className="bg-gray-800">Corretor (Broker)</option>
                        <option value={Role.MANAGER} className="bg-gray-800">Gerente (Manager)</option>
                        <option value={Role.ADMIN} className="bg-gray-800">Admin</option>
                    </select>

                    <button
                        type="submit"
                        disabled={isLoading || !!successMessage}
                        className="btn btn-primary w-full"
                    >
                        {isLoading ? 'Registrando...' : 'Registrar'}
                    </button>
                    {localError && <p className="text-sm text-red-400 text-center">{localError}</p>}
                    {successMessage && <p className="text-sm text-green-400 text-center">{successMessage}</p>}
                </form>
                 <p className="mt-4 text-center text-sm text-gray-400">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-medium text-orange-400 hover:text-orange-300">
                        Faça o login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
