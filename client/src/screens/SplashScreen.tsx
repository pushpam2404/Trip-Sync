import React from 'react';
import { LogoSvg } from '../constants';

export const SplashScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col items-center z-10 animate-fade-in">
                <div className="w-24 h-24 mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center justify-center">
                    <LogoSvg />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">TripSync</h1>
                <p className="text-xs text-slate-500 mt-2 font-medium">Smart Travel Companion</p>
            </div>
        </div>
    );
};
