import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { TabId } from '../types';
import { HomeIcon, SakhaIcon, PlannerIcon, PlacesIcon, HistoryIcon, LogoSvg } from '../constants';
import { SakhaScreen } from './SakhaScreen';
import { PlannerScreen } from './planner/PlannerScreen';
import { DestinationsScreen } from './DestinationsScreen';
import { HistoryScreen } from './HistoryScreen';
import { GlobalModals } from '../components/common/GlobalModals';

export const MainScreen = () => {
    const { activeTab, setActiveTab } = useAppContext();
    const navigate = useNavigate();

    const renderContent = () => {
        switch (activeTab) {
            case 'sakha': return <SakhaScreen />;
            case 'planner': return <PlannerScreen />;
            case 'destinations': return <DestinationsScreen />;
            case 'history': return <HistoryScreen />;
            default: return <SakhaScreen />;
        }
    };

    const navItems = [
        { id: 'home', icon: HomeIcon, label: 'Home', action: () => navigate('/') },
        { id: 'sakha', icon: SakhaIcon, label: 'Sakha', action: () => setActiveTab('sakha') },
        { id: 'planner', icon: PlannerIcon, label: 'Planner', action: () => setActiveTab('planner') },
        { id: 'destinations', icon: PlacesIcon, label: 'Saved', action: () => setActiveTab('destinations') },
        { id: 'history', icon: HistoryIcon, label: 'History', action: () => setActiveTab('history') },
    ];

    return (
        <div className="h-screen flex flex-col md:flex-row bg-background text-text">
            {/* Desktop Left Sidebar */}
            <div className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-border-default md:bg-surface md:p-6 md:space-y-8 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center p-1.5">
                        <LogoSvg />
                    </div>
                    <div>
                        <h1 className="text-sm font-extrabold tracking-tight text-white">TripSync</h1>
                        <p className="text-[10px] text-slate-500">Smart Travel Companion</p>
                    </div>
                </div>
                
                <nav className="flex-grow space-y-2">
                    {navItems.map(item => {
                        const isCurrent = item.id === 'home' ? false : activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${isCurrent ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                                <item.icon isActive={isCurrent} className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden relative">
                <div className="flex-grow overflow-y-auto pb-24 md:pb-6">
                    {renderContent()}
                </div>
                
                {/* Minimal Premium Bottom Navigation Bar (Mobile only) */}
                <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/60 backdrop-blur-md border-t border-slate-900 py-3 px-4 z-20 safe-bottom">
                    <div className="flex justify-around items-center max-w-sm mx-auto">
                        {navItems.map(item => {
                            const isCurrent = item.id === 'home' ? false : activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={item.action}
                                    className="group flex flex-col items-center justify-center space-y-1 py-1 rounded-lg w-14 active:scale-95 transition-all cursor-pointer"
                                    aria-label={`Go to ${item.label}`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-all duration-150 ${isCurrent ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-350'}`}>
                                        <item.icon isActive={isCurrent} className="w-4.5 h-4.5" />
                                    </div>
                                    <span className={`text-[9px] font-bold tracking-wide uppercase transition-colors duration-150 ${isCurrent ? 'text-cyan-400' : 'text-slate-650 group-hover:text-slate-500'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <GlobalModals />
        </div>
    );
};
