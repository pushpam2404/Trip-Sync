import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { UserProfile, Vehicle } from '../types';
import { ArrowLeftIcon, CarIcon, TrashIcon, BikeIcon } from '../constants';

export const AccountScreen = () => {
    const { user, setUser, theme, setTheme, handleLogout } = useAppContext();
    const navigate = useNavigate();
    
    const [draftUser, setDraftUser] = useState<UserProfile | null>(user ? JSON.parse(JSON.stringify(user)) : null);
    const [newVehicle, setNewVehicle] = useState({ type: 'fourWheelers', reg: '' });

    if (!draftUser) return null;

    const handleSaveChanges = () => {
        setUser(draftUser);
        navigate('/');
    };

    const handleAddVehicle = (e: React.FormEvent) => {
        e.preventDefault();
        if (newVehicle.reg) {
            const vehicle: Vehicle = { id: String(Date.now()), regNumber: newVehicle.reg.toUpperCase() };
            const type = newVehicle.type as 'twoWheelers' | 'fourWheelers';
            setDraftUser(prev => prev ? { ...prev, [type]: [...prev[type], vehicle] } : null);
            setNewVehicle({ type: 'fourWheelers', reg: '' });
        }
    };

    const handleRemoveVehicle = (type: 'twoWheelers' | 'fourWheelers', id: string) => {
        setDraftUser(prev => prev ? { ...prev, [type]: prev[type].filter(v => v.id !== id) } : null);
    };

    const handleRegNumberChange = (type: 'twoWheelers' | 'fourWheelers', id: string, newRegNumber: string) => {
        setDraftUser(prev => {
            if (!prev) return null;
            const updatedVehicles = prev[type].map(vehicle =>
                vehicle.id === id ? { ...vehicle, regNumber: newRegNumber.toUpperCase() } : vehicle
            );
            return { ...prev, [type]: updatedVehicles };
        });
    };

    return (
        <div className="h-screen text-text flex flex-col bg-background relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="flex items-center p-4 border-b border-border-default flex-shrink-0 bg-surface/60 backdrop-blur-md sticky top-0 z-20">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer" 
                    aria-label="Go back to home"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <h1 className="text-base font-bold ml-4 text-white">Account Settings</h1>
            </header>

            <div className="flex-grow overflow-y-auto p-6 max-w-sm md:max-w-4xl w-full mx-auto space-y-8 animate-fade-in relative z-10">
                {/* Profile Details */}
                <div className="card bg-slate-900 border border-slate-800 space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                            value={draftUser.name}
                            onChange={e => setDraftUser({ ...draftUser, name: e.target.value })}
                            className="input"
                            placeholder="Full name"
                        />
                    </div>
                    <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold uppercase tracking-wider">Registered Phone</span>
                        <span className="text-slate-200 font-bold">{draftUser.phone}</span>
                    </div>
                </div>

                {/* Appearance Settings */}
                <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appearance</h2>
                    <div className="card bg-slate-900 border border-slate-800 p-4 flex justify-between items-center shadow-sm">
                        <span className="text-sm font-semibold text-slate-200">Dark Theme</span>
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className={`relative w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${theme === 'dark' ? 'bg-cyan-500' : 'bg-slate-850 border border-slate-700'}`}
                            role="switch"
                            aria-checked={theme === 'dark'}
                            aria-label="Toggle dark mode"
                        >
                            <span className={`w-4 h-4 bg-slate-950 rounded-full shadow transform transition-transform absolute ${theme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`}></span>
                        </button>
                    </div>
                </div>

                {/* Registered Vehicles */}
                <div className="space-y-6">
                    <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Registered Vehicles</h2>

                    {/* 4W List */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Four-wheelers ({draftUser.fourWheelers.length})</h3>
                        {draftUser.fourWheelers.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No four-wheelers registered</p>
                        ) : (
                            <div className="space-y-2">
                                {draftUser.fourWheelers.map(v => (
                                    <div key={v.id} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-lg hover:border-slate-700 transition-colors">
                                        <div className="flex items-center flex-grow mr-2">
                                            <CarIcon className="w-4 h-4 mr-3 text-cyan-400 flex-shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Add Reg. No."
                                                value={v.regNumber}
                                                onChange={(e) => handleRegNumberChange('fourWheelers', v.id, e.target.value)}
                                                className="font-bold text-white bg-transparent focus:outline-none placeholder-slate-700 w-full text-xs uppercase"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveVehicle('fourWheelers', v.id)} 
                                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                            aria-label="Remove vehicle"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2W List */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Two-wheelers ({draftUser.twoWheelers.length})</h3>
                        {draftUser.twoWheelers.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No two-wheelers registered</p>
                        ) : (
                            <div className="space-y-2">
                                {draftUser.twoWheelers.map(v => (
                                    <div key={v.id} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-lg hover:border-slate-700 transition-colors">
                                        <div className="flex items-center flex-grow mr-2">
                                            <BikeIcon className="w-4 h-4 mr-3 text-cyan-400 flex-shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Add Reg. No."
                                                value={v.regNumber}
                                                onChange={(e) => handleRegNumberChange('twoWheelers', v.id, e.target.value)}
                                                className="font-bold text-white bg-transparent focus:outline-none placeholder-slate-700 w-full text-xs uppercase"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveVehicle('twoWheelers', v.id)} 
                                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                            aria-label="Remove vehicle"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Vehicle Form */}
                    <form onSubmit={handleAddVehicle} className="card bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-inner">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add new vehicle</h3>
                        <div className="flex gap-2">
                            <select 
                                value={newVehicle.type} 
                                onChange={e => setNewVehicle(p => ({ ...p, type: e.target.value }))} 
                                className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-cyan-500 text-white cursor-pointer"
                            >
                                <option value="fourWheelers">4W</option>
                                <option value="twoWheelers">2W</option>
                            </select>
                            <input
                                value={newVehicle.reg}
                                onChange={e => setNewVehicle(p => ({ ...p, reg: e.target.value.toUpperCase() }))}
                                placeholder="MH 12 AB 1234"
                                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 flex-grow text-xs font-bold text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                            />
                            <button type="submit" className="btn btn-primary text-xs py-2 px-3 cursor-pointer">Add</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-border-default flex gap-4 bg-surface/60 backdrop-blur-md sticky bottom-0 z-20 safe-bottom">
                <button
                    onClick={handleLogout}
                    className="flex-1 btn btn-danger cursor-pointer"
                >
                    Logout
                </button>
                <button
                    onClick={handleSaveChanges}
                    className="flex-1 btn btn-primary cursor-pointer"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};
