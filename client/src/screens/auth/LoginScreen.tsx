import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TripSyncAppIcon, IndianFlagIcon } from '../../constants';

export const LoginScreen = () => {
    const { handleLogin, isLoading } = useAuth();
    const navigate = useNavigate();
    
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLoginClick = async () => {
        if (phone.length === 10 && password.length > 0) {
            setError('');
            const result = await handleLogin(`+91 ${phone}`, password);
            if (!result.success && result.message) {
                setError(result.message);
            }
        }
    };

    const canSubmit = phone.length === 10 && password.length >= 1 && !isLoading;

    return (
        <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
            {/* Soft Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-sm card bg-slate-900 border border-slate-800 shadow-xl relative z-10 animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-3 shadow-inner">
                        <TripSyncAppIcon />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Sign in to TripSync</h2>
                    <p className="text-xs text-slate-400 mt-1 text-center">Sync your trips and vehicle fleets in real time</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3 mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Number</label>
                        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all">
                            <IndianFlagIcon />
                            <span className="ml-2 mr-1.5 text-slate-400 font-medium text-sm">+91</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                className="bg-transparent text-white w-full focus:outline-none placeholder-slate-600 font-medium text-sm"
                                placeholder="00000 00000"
                                aria-label="Mobile number input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="Enter password"
                            aria-label="Password input"
                        />
                    </div>
                </div>

                <button
                    onClick={handleLoginClick}
                    className="btn btn-primary btn-full mt-6"
                    disabled={!canSubmit}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
                    ) : 'Sign In'}
                </button>

                <p className="mt-6 text-center text-slate-400 text-xs">
                    Don't have an account?{' '}
                    <button
                        onClick={() => navigate('/signup')}
                        className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
};
