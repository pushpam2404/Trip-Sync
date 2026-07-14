import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SavedRoute } from '../types';
import { PlacesIcon, TrashIcon, HomeIcon, HistoryIcon, ReverseIcon } from '../constants';
import { TabScreenHeader } from '../components/common/TabScreenHeader';

export const DestinationsScreen = () => {
    const { savedRoutes, removeRoute, reverseRoute, startNavigationFrom } = useAppContext();

    const handleNavigate = (route: SavedRoute) => {
        startNavigationFrom(route.origin, route.destination);
    }

    if (savedRoutes.length === 0) {
        return (
            <>
                <TabScreenHeader title="Saved Places" />
                <div className="p-6 text-slate-100 text-center mt-12 max-w-sm w-full mx-auto animate-fade-in">
                    <div className="w-16 h-16 mx-auto bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <PlacesIcon isActive={false} className="w-6 h-6 text-slate-500" />
                    </div>
                    <h2 className="text-base font-bold text-white">No saved routes yet</h2>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Routes you save from your Planner will appear here for one-click navigation.</p>
                </div>
            </>
        )
    }

    return (
        <>
            <TabScreenHeader title="Saved Places" />
            <div className="p-6 text-slate-100 max-w-sm w-full mx-auto space-y-4 animate-fade-in">
                <p className="text-xs text-slate-500 leading-relaxed">Your saved trip itineraries and attraction hops.</p>
                <div className="space-y-4">
                    {savedRoutes.map(route => (
                        <div key={route.id} className="card bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">Saved Itinerary</span>
                                    <h3 className="text-sm font-bold text-white leading-tight">{route.origin}</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">to</p>
                                    <h3 className="text-sm font-bold text-white leading-tight">{route.destination}</h3>
                                </div>
                                <button 
                                    onClick={() => removeRoute(route.id)} 
                                    className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                    aria-label="Delete saved route"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 space-y-2">
                                <div className="flex items-center text-xs text-slate-400">
                                    <HomeIcon isActive={false} className="w-4 h-4 text-slate-500 mr-2.5" />
                                    <span>From stay: <span className="text-white font-semibold">{route.stay}</span></span>
                                </div>
                                <div className="flex items-center text-xs text-slate-400">
                                    <HistoryIcon isActive={false} className="w-4 h-4 text-slate-500 mr-2.5" />
                                    <span>Approx: <span className="text-white font-semibold">{route.travelTime || '2h 15m'}</span></span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => reverseRoute(route.id)}
                                    className="flex-1 btn btn-secondary text-xs py-2 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <ReverseIcon className="w-3.5 h-3.5" />
                                    Reverse
                                </button>
                                <button
                                    onClick={() => handleNavigate(route)}
                                    className="flex-1 btn btn-primary text-xs py-2 cursor-pointer"
                                >
                                    Navigate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
