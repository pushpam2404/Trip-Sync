import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon } from '../../constants';
import { VehicleCounter } from '../../components/common/VehicleCounter';

export const ProfileSetup1Screen = () => {
    const { startProfileSetup, handleLogout } = useAuth();
    const navigate = useNavigate();
    
    const [name, setName] = useState('');
    const [numTwoWheelers, setNumTwoWheelers] = useState(0);
    const [numFourWheelers, setNumFourWheelers] = useState(0);

    const handleContinue = () => {
        if (name) {
            startProfileSetup({ name, numTwoWheelers, numFourWheelers });
        }
    };

    return (
        <div className="min-h-screen text-slate-100 flex flex-col bg-slate-950 p-6 relative overflow-hidden">
            {/* Soft Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="flex items-center justify-between py-4 z-20">
                <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer" 
                    aria-label="Go back to login"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step 1 of 2</div>
            </header>

            <div className="flex-grow max-w-sm w-full mx-auto flex flex-col justify-center animate-fade-in relative z-10">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Let's build your profile</h1>
                    <p className="text-xs text-slate-400 mt-2">Introduce yourself to configure your smart navigation system</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                            className="input"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">How many vehicles do you own?</h2>
                        <VehicleCounter
                            label="Two Wheelers (2W)"
                            value={numTwoWheelers}
                            onIncrement={() => setNumTwoWheelers(v => v + 1)}
                            onDecrement={() => setNumTwoWheelers(v => Math.max(0, v - 1))}
                        />
                        <VehicleCounter
                            label="Four Wheelers (4W)"
                            value={numFourWheelers}
                            onIncrement={() => setNumFourWheelers(v => v + 1)}
                            onDecrement={() => setNumFourWheelers(v => Math.max(0, v - 1))}
                        />
                    </div>
                </div>

                <button
                    onClick={handleContinue}
                    className="btn btn-primary btn-full mt-8"
                    disabled={!name}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};
