import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TripSyncAppIcon, IndianFlagIcon, ArrowLeftIcon, EyeOpenIcon, EyeClosedIcon } from '../../constants';

export const SignUpScreen = () => {
    const { handleSignup, isLoading } = useAuth();
    const navigate = useNavigate();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSignupClick = async () => {
        // Password validation checks
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

        if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            const errorList = [
                "Password requirements not met:",
                "• At least 8 characters long",
                "• One uppercase letter",
                "• One lowercase letter",
                "• One number",
                "• One special character"
            ].join('\n');
            setError(errorList);
            setPassword(''); // Clear the password field
            return;
        }

        if (phone.length === 10) {
            setError('');
            const result = await handleSignup(phone, password);
            if (!result.success && result.message) {
                setError(result.message);
            }
        }
    };

    const canSubmit = phone.length === 10 && password.length > 0 && !isLoading;

    return (
        <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
            {/* Soft Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header back button */}
            <header className="absolute top-4 left-4 z-20">
                <button 
                    onClick={() => navigate('/login')} 
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer" 
                    aria-label="Go back"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </button>
            </header>

            <div className="w-full max-w-sm card bg-slate-900 border border-slate-800 shadow-xl relative z-10 animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-3 shadow-inner">
                        <TripSyncAppIcon />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Create your account</h2>
                    <p className="text-xs text-slate-400 mt-1 text-center">Join TripSync to plan and save your journeys</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3.5 mb-4 text-left leading-relaxed">
                        {error.split('\n').map((line, index) => (
                            <p key={index} className={index === 0 ? 'font-bold mb-1.5' : 'ml-2 text-[11px] font-medium text-rose-300'}>{line}</p>
                        ))}
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
                        <div className="relative">
                            <input
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pr-10"
                                placeholder="Create secure password"
                                aria-label="Password input"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(prev => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-355 transition-colors cursor-pointer"
                                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                            >
                                {isPasswordVisible ? <EyeOpenIcon className="w-4 h-4" /> : <EyeClosedIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSignupClick}
                    className="btn btn-primary btn-full mt-6"
                    disabled={!canSubmit}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
                    ) : 'Create Account'}
                </button>

                <p className="mt-6 text-center text-slate-400 text-xs">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};
