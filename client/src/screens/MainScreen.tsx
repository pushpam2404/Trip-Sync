import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { TabId } from '../types';
import { HomeIcon, SakhaIcon, PlannerIcon, PlacesIcon, HistoryIcon } from '../constants';
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
        <div className="h-screen flex flex-col bg-slate-950">
            <div className="flex-grow overflow-y-auto pb-24">
                {renderContent()}
            </div>
            
            {/* Minimal Premium Bottom Navigation Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-slate-900/60 backdrop-blur-md border-t border-slate-900 py-3 px-4 z-20 safe-bottom">
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
            <GlobalModals />
        </div>
    );
};
