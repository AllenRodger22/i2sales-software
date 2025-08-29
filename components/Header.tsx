
import React from 'react';
// Use the same Auth context as the rest of the app (src/auth/useAuth).
import { useAuth } from '../src/auth/useAuth';
import { LogoutIcon } from './Icons';

const Header: React.FC = () => {
    const { user, signOut } = useAuth();
    const meta = (user as any)?.user_metadata || {};
    const name = meta.name || user?.email?.split('@')[0];
    const role = meta.role;

    return (
        <header className="flex-shrink-0 glass border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex-1">
                {/* This space is intentionally left for potential future use like breadcrumbs */}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right">
                    <p className="font-semibold text-white text-sm sm:text-base">{name}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{role}</p>
                </div>
                <button 
                    onClick={signOut}
                    className="p-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    aria-label="Logout"
                >
                    <LogoutIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;
