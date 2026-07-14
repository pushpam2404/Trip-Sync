import React, { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { Trip } from "../types";
import {
  HistoryIcon,
  TrashIcon,
  CarIcon,
  BikeIcon,
  TrainIcon,
  WalkingIcon,
  PlacesIcon,
} from "../constants";
import { TabScreenHeader } from "../components/common/TabScreenHeader";

export const HistoryScreen = () => {
  const { trips, startNavigationFrom, removeTrip, clearTrips } =
    useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNavigate = (trip: Trip) => {
    startNavigationFrom(trip.from, trip.to);
  };

  const handleDeleteAll = () => {
    clearTrips();
    setShowConfirm(false);
  };

  const DetailItem = ({
    icon: Icon,
    value,
  }: {
    icon: React.ElementType;
    value: string | number;
  }) => (
    <div className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700/40 py-1 px-2.5 rounded-md text-slate-350">
      <Icon className="w-3.5 h-3.5 text-cyan-400 mr-1.5 flex-shrink-0" />
      <span>{value}</span>
    </div>
  );

  const ModeIcon = ({ mode }: { mode: Trip["mode"] }) => {
    switch (mode) {
      case "4W":
        return CarIcon;
      case "2W":
        return BikeIcon;
      case "train":
        return TrainIcon;
      case "walking":
        return WalkingIcon;
      default:
        return CarIcon;
    }
  };

  const TravelersIcon = ({ className = "w-6 h-6" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.284-1.255-.778-1.682M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.284-1.255.778-1.682M12 15a4 4 0 100-8 4 4 0 000 8z"
      />
    </svg>
  );

  if (showConfirm) {
    return (
      <div className="overlay animate-fade-in">
        <div className="modal text-center space-y-4 max-w-sm">
          <h2 className="text-base font-bold text-white">
            Clear Trip History?
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This will permanently delete all your trip history logs. This action
            cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 btn btn-secondary text-xs py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAll}
              className="flex-1 btn btn-danger text-xs py-2 cursor-pointer"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <>
        <TabScreenHeader title="Trip History" />
        <div className="p-6 text-text text-center mt-12 max-w-sm md:max-w-4xl w-full mx-auto animate-fade-in">
          <div className="w-16 h-16 mx-auto bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <HistoryIcon isActive={false} className="w-6 h-6 text-slate-500" />
          </div>
          <h2 className="text-base font-bold text-white">
            No trip history yet
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Completed driving trips from Sakha navigation will be recorded here.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <TabScreenHeader title="Trip History" />
      <div className="p-6 text-text max-w-sm md:max-w-4xl w-full mx-auto space-y-4 animate-fade-in">
        <div className="flex justify-between items-center text-xs">
          <p className="text-slate-500">
            {trips.length} trip{trips.length > 1 ? "s" : ""} recorded
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-rose-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
          >
            Delete All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip, index) => (
            <div
              key={trip.id}
              className="card bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">{`Trip Log #${trips.length - index}`}</span>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {trip.from} to {trip.to}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {trip.date}
                  </p>
                </div>
                <button
                  onClick={() => removeTrip(trip.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  aria-label="Remove trip log"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                <DetailItem
                  icon={ModeIcon({ mode: trip.mode })}
                  value={trip.vehicleNumber || trip.mode}
                />
                <DetailItem
                  icon={TravelersIcon}
                  value={`${trip.travelers} Pax`}
                />
                <DetailItem
                  icon={(props: any) => (
                    <PlacesIcon isActive={true} {...props} />
                  )}
                  value={`${trip.stops} Stop${trip.stops > 1 ? "s" : ""}`}
                />
                <DetailItem icon={HistoryIcon} value={trip.duration} />
              </div>

              <button
                onClick={() => handleNavigate(trip)}
                className="btn btn-primary btn-full py-2 text-xs font-bold uppercase tracking-wider mt-2 cursor-pointer"
              >
                Re-Navigate
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
