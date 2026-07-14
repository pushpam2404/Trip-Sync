import React from 'react';

export const VehicleCounter = ({ label, value, onIncrement, onDecrement }: { label: string; value: number; onIncrement: () => void; onDecrement: () => void; }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between items-center transition-all hover:border-slate-700">
            <span className="text-sm font-medium text-slate-200">{label}</span>
            <div className="flex items-center space-x-4">
                <button
                    onClick={onDecrement}
                    disabled={value === 0}
                    className="w-7 h-7 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed"
                    aria-label={`Decrease number of ${label}`}
                >
                    <span className="text-sm leading-none font-bold">-</span>
                </button>
                <div className="w-6 text-center">
                    <span className="text-sm font-bold text-white">{value}</span>
                </div>
                <button
                    onClick={onIncrement}
                    className="w-7 h-7 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    aria-label={`Increase number of ${label}`}
                >
                    <span className="text-sm leading-none font-bold">+</span>
                </button>
            </div>
        </div>
    );
};
