import React from 'react';

// ─── App Brand Icons ───

export const LogoSvg: React.FC = () => (
    <svg className="w-full h-full" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pin-gradient" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <filter id="cyan-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
          d="M32 2 C18.7 2 8 12.7 8 26 C8 44 32 62 32 62 S56 44 56 26 C56 12.7 45.3 2 32 2 Z"
          fill="url(#pin-gradient)"
      />
      <path 
        d="M32,5 C43.2,5 52.8,11.8 55,22 C46,15 39,13 32,13 C25,13 18,15 9,22 C11.2,11.8 20.8,5 32,5 Z" 
        fill="white" 
        opacity="0.2"
      />
      <circle cx="32" cy="28" r="14" fill="#0f172a" />
      <g filter="url(#cyan-glow)">
        <path
            d="M26 24 C 26 34 38 22 38 32"
            stroke="#06b6d4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
        />
        <circle cx="26" cy="24" r="3.5" fill="#06b6d4" />
        <circle cx="38" cy="32" r="3.5" fill="#06b6d4" />
      </g>
    </svg>
);

export const TripSyncAppIcon: React.FC = () => (
    <div className="flex flex-col items-center select-none">
        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl border border-slate-800 p-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent"></div>
            <div className="w-14 h-14 text-cyan-400 z-10">
                <LogoSvg />
            </div>
        </div>
        <p className="text-white text-xl font-bold tracking-tight mt-3">TripSync</p>
    </div>
);

// ─── Indian Flag for Auth Screen ───

export const IndianFlagIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-4 rounded-sm shadow-sm" viewBox="0 0 21 15">
        <rect width="21" height="15" fill="#fff"/>
        <rect width="21" height="5" fill="#f93"/>
        <rect width="21" height="5" y="10" fill="#128807"/>
        <circle cx="10.5" cy="7.5" r="2" fill="#008" fillOpacity=".25"/>
        <circle cx="10.5" cy="7.5" r="1.6" fill="#fff"/>
        <circle cx="10.5" cy="7.5" r=".8" fill="#008"/>
    </svg>
);

// ─── Bottom Tab Nav Icons ───

export const HomeIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className = "w-6 h-6" }) => (
    <svg className={`${className} transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

export const SakhaIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className = "w-6 h-6" }) => (
    <svg className={`${className} transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
    </svg>
);

export const PlannerIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className = "w-6 h-6" }) => (
    <svg className={`${className} transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 10V7" />
    </svg>
);

export const PlacesIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className = "w-6 h-6" }) => (
    <svg className={`${className} transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const HistoryIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className = "w-6 h-6" }) => (
    <svg className={`${className} transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ─── Transit Mode Icons ───

export const CarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5h12.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 14.25c0-1.036.84-1.875 1.875-1.875h13.5c1.036 0 1.875.84 1.875 1.875v2.25c0 1.035-.84 1.875-1.875 1.875h-13.5a1.875 1.875 0 01-1.875-1.875v-2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75v-2.625c0-.965.785-1.75 1.75-1.75h11.5c.965 0 1.75.785 1.75 1.75v2.625" />
  </svg>
);

export const FourWheelerIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-gray-700 dark:text-gray-300" }) => (
    <CarIcon className={className} />
);

export const BikeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="18" r="3" />
    <circle cx="19" cy="18" r="3" />
    <path d="M12 18h-3.5" />
    <path d="M15 18h-1" />
    <path d="M5 15l1.5-3 2-2 3.5 4 2-3h3" />
    <path d="M11 9h3" />
  </svg>
);

export const TwoWheelerIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-gray-700 dark:text-gray-300" }) => (
    <BikeIcon className={className} />
);

export const TrainIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8.5V4a2 2 0 00-2-2h-8a2 2 0 00-2 2v4.5m12 0V15a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 016 15V8.5m12 0h-12m12 0H6m4 11.5h4M4 19h16" />
      <circle cx="12" cy="12" r="2" />
  </svg>
);

export const WalkingIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4.5" r="2.5"/>
        <path d="M14 20l-4-6-4 3"/>
        <path d="M10 14l1-5 4.5 3"/>
    </svg>
);

// ─── Navigation Instructions ───

export const TurnLeftIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-6-6 6-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h12a6 6 0 016 6v3" />
    </svg>
);

export const TurnRightIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6-6-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 9H9a6 6 0 00-6 6v3" />
    </svg>
);

export const StraightIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 14l-4-4m4 4l4-4" />
    </svg>
);

export const UTurnIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m0 0l-3-3m3 3l3-3m5 3H7a6 6 0 010-12h2" />
    </svg>
);

export const MergeIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l4-4-4-4" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h4" />
    </svg>
);

// ─── Map Category / Nearby Icons ───

export const PetrolPumpIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 19V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10M3 19h18M9 7h6" />
        <circle cx="12" cy="13" r="2" />
    </svg>
);

export const RestaurantIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H7a3 3 0 00-3 3v4a3 3 0 003 3h10a3 3 0 003-3V8a3 3 0 00-3-3z" />
    </svg>
);

export const AtmIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h10M7 14h6" />
    </svg>
);

export const EvChargingIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

// ─── Utility UI Icons ───

export const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-red-500" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const ReverseIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

export const RecenterIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8m-4-4h8" />
    </svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 013 3v5a3 3 0 01-6 0v-5a3 3 0 013-3z" />
    </svg>
);

export const PaperPlaneIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

export const EyeOpenIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const EyeClosedIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
);
