import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { TabId } from '../types';
import { 
    LogoSvg, 
    SakhaIcon, 
    PlannerIcon, 
    PlacesIcon, 
    HistoryIcon 
} from '../constants';

export const HomeScreen = () => {
    const { user, setActiveTab } = useAppContext();
    const navigate = useNavigate();

    const getInitials = (name: string | undefined) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1 && parts[1]) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const FeatureCard = ({ 
        iconComponent: Icon, 
        title, 
        subtitle, 
        colorClass,
        onClick 
    }: { 
        iconComponent: React.ElementType; 
        title: string; 
        subtitle: string; 
        colorClass: string;
        onClick: () => void;
    }) => (
        <button 
            onClick={onClick} 
            className="group relative text-left bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm flex flex-col justify-between overflow-hidden cursor-pointer"
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass} bg-opacity-10 text-white mb-4`}>
                <Icon isActive={true} className="w-5 h-5 text-white" />
            </div>
            
            <div className="relative z-10">
                <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors duration-150">{title}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
            </div>
        </button>
    );

    const navigateToTab = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/app');
    };

    return (
        <div className="p-6 min-h-screen flex flex-col justify-between bg-background text-text relative overflow-hidden">
            {/* Background Ambient Lights */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex-grow space-y-8 max-w-sm md:max-w-4xl w-full mx-auto animate-fade-in">
                {/* Header */}
                <header className="flex justify-between items-center py-2 relative z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center p-1.5">
                            <LogoSvg />
                        </div>
                        <div>
                            <h1 className="text-sm font-extrabold tracking-tight text-white">TripSync</h1>
                            <p className="text-[10px] text-slate-500">Smart Travel Companion</p>
                        </div>
                    </div>
                    
                    <button
                        className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all rounded-full flex items-center justify-center cursor-pointer text-white font-bold text-xs shadow-sm"
                        onClick={() => navigate('/account')}
                        aria-label="Go to account page"
                    >
                        {getInitials(user?.name)}
                    </button>
                </header>

                {/* Welcome Card */}
                <div className="relative overflow-hidden rounded-xl border border-slate-800 p-5 bg-slate-900/40 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Where would you like to travel today? Pick a feature below or talk to Sakha AI to plan details.</p>
                </div>

                {/* Features Grid */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Features</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FeatureCard
                            iconComponent={SakhaIcon}
                            title="Sakha Assistant"
                            subtitle="AI route parsing & chat"
                            colorClass="text-teal-400 bg-teal-400"
                            onClick={() => navigateToTab('sakha')}
                        />
                        <FeatureCard
                            iconComponent={PlannerIcon}
                            title="Trip Planner"
                            subtitle="Accommodations & stays"
                            colorClass="text-orange-400 bg-orange-400"
                            onClick={() => navigateToTab('planner')}
                        />
                        <FeatureCard
                            iconComponent={PlacesIcon}
                            title="Saved Places"
                            subtitle="Your favorite list"
                            colorClass="text-rose-400 bg-rose-400"
                            onClick={() => navigateToTab('destinations')}
                        />
                        <FeatureCard
                            iconComponent={HistoryIcon}
                            title="Trip History"
                            subtitle="Past road trip logs"
                            colorClass="text-blue-400 bg-blue-400"
                            onClick={() => navigateToTab('history')}
                        />
                    </div>
                </section>

                {/* Registered Vehicles Summary */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">My Fleet Details</h2>
                    <div className="card bg-slate-900 border border-slate-800 p-5 flex justify-around text-center shadow-sm">
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-cyan-400">{user?.twoWheelers?.length || 0}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">2-Wheelers</p>
                        </div>
                        <div className="w-px bg-slate-800 self-stretch"></div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-cyan-400">{user?.fourWheelers?.length || 0}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">4-Wheelers</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
