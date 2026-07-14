import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeftIcon } from "../../constants";

export const ProfileSetup2Screen = () => {
  const { profileSetupData, completeProfileSetup } = useAuth();
  const navigate = useNavigate();

  const [twoWheelers, setTwoWheelers] = useState<string[]>([]);
  const [fourWheelers, setFourWheelers] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profileSetupData) {
      setTwoWheelers(Array(profileSetupData.numTwoWheelers).fill(""));
      setFourWheelers(Array(profileSetupData.numFourWheelers).fill(""));
    } else {
      navigate("/profile/setup-1");
    }
  }, [profileSetupData, navigate]);

  const handleComplete = async () => {
    setError("");
    const result = await completeProfileSetup({ twoWheelers, fourWheelers });
    if (result && !result.success && result.message) {
      setError(result.message);
    }
  };

  const handleSkip = async () => {
    setError("");
    // Complete with no vehicles
    const result = await completeProfileSetup({
      twoWheelers: [],
      fourWheelers: [],
    });
    if (result && !result.success && result.message) {
      setError(result.message);
    }
  };

  const canComplete = useMemo(() => {
    if (!profileSetupData) return false;
    const hasNoVehicles =
      profileSetupData.numTwoWheelers === 0 &&
      profileSetupData.numFourWheelers === 0;
    if (hasNoVehicles) return true;

    const allTwoWheelersFilled = twoWheelers.every((reg) => reg.trim() !== "");
    const allFourWheelersFilled = fourWheelers.every(
      (reg) => reg.trim() !== "",
    );
    return allTwoWheelersFilled && allFourWheelersFilled;
  }, [twoWheelers, fourWheelers, profileSetupData]);

  if (!profileSetupData) return null;

  const hasVehicles =
    profileSetupData.numTwoWheelers > 0 || profileSetupData.numFourWheelers > 0;

  const renderVehicleInputs = (
    count: number,
    type: "2-Wheeler" | "4-Wheeler",
    state: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (count === 0) return null;
    return (
      <div className="space-y-3">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {type} Registration Details
        </h2>
        {Array.from({ length: count }).map((_, index) => (
          <div key={`${type}-${index}`} className="space-y-1">
            <label className="block text-xs text-slate-500 font-medium">
              {type} #{index + 1} Reg. No.
            </label>
            <input
              type="text"
              value={state[index] || ""}
              onChange={(e) => {
                const newState = [...state];
                newState[index] = e.target.value.toUpperCase();
                setState(newState);
              }}
              className="input"
              placeholder="MH 12 AB 1234"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col bg-slate-950 p-6 relative overflow-hidden">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="flex items-center justify-between py-4 z-20">
        <button
          onClick={() => navigate("/profile/setup-1")}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Step 2 of 2
        </div>
      </header>

      <div className="flex-grow max-w-sm w-full mx-auto flex flex-col justify-center animate-fade-in relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Register vehicles
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {hasVehicles
              ? "Enter your vehicle registration numbers for automated log sheets"
              : "No vehicles declared. You are ready to complete your profile."}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg p-3.5 mb-6 text-center leading-relaxed font-medium">
            {error}
          </div>
        )}

        <div className="space-y-6 overflow-y-auto max-h-[40vh] pr-1.5 scrollbar-thin">
          {renderVehicleInputs(
            profileSetupData.numTwoWheelers,
            "2-Wheeler",
            twoWheelers,
            setTwoWheelers,
          )}
          {renderVehicleInputs(
            profileSetupData.numFourWheelers,
            "4-Wheeler",
            fourWheelers,
            setFourWheelers,
          )}
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className="btn btn-primary btn-full"
          >
            Complete Profile Setup
          </button>
          <button
            onClick={handleSkip}
            className="btn btn-ghost btn-full font-semibold text-xs"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
