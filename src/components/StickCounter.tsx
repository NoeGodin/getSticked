import React, { useState } from "react";
import { Check, History, Minus, Plus } from "lucide-react";
import StickLog from "./StickLog";
import type { StickCounterProps } from "../types/ui.types";

const StickCounter: React.FC<StickCounterProps> = ({ playerName, sticks }) => {
  const totalSticks = sticks.reduce((sum, stick) => sum + stick.count, 0);
  const [currentSticks, setCurrentSticks] = useState<number>(totalSticks);
  const [tempCount, setTempCount] = useState<number>(totalSticks);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);

  const handleAdd = () => {
    setTempCount((prev) => prev + 1);
  };

  const handleRemove = () => {
    setTempCount((prev) => Math.max(0, prev - 1));
  };

  const handleValidate = async () => {
    const difference = tempCount - currentSticks;

    if (difference > 0) {
      console.log(`Adding ${difference} sticks to ${playerName}`);
      // TODO: Open the modal to add a comment which will modify the db
    } else if (difference < 0) {
      console.log(`deleting ${Math.abs(difference)} sticks to ${playerName}`);
      // TODO: Delete the last ${Math.abs(difference)} sticks from the db
    }
    setCurrentSticks(tempCount);
  };

  const handleOpenLog = () => {
    setIsLogOpen(true);
  };

  const handleCloseLog = () => {
    setIsLogOpen(false);
  };

  // Function that renders the sticks based on the count
  const renderSticks = (count: number) => {
    const groups = Math.floor(count / 5);
    const remainder = count % 5;
    const sticks = [];

    // This one renders groups of 5 sticks
    for (let i = 0; i < groups; i++) {
      sticks.push(
        <div key={`group-${i}`} className="relative inline-block mx-2">
          {/* the 4 vertical bar */}
          <div className="flex space-x-1">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="w-1 h-12 bg-gray-800 rounded-sm" />
            ))}
          </div>
          {/* diagonal bar */}
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="w-8 h-0.5 bg-gray-800 rotate-45 transform origin-center" />
          </div>
        </div>,
      );
    }

    // This one renders the remainder sticks (1 to 4)
    if (remainder > 0) {
      sticks.push(
        <div key="remainder" className="flex space-x-1 mx-2">
          {[...Array(remainder)].map((_, i) => (
            <div key={i} className="w-1 h-12 bg-gray-800 rounded-sm" />
          ))}
        </div>,
      );
    }

    return sticks;
  };

  const hasChanges = currentSticks !== tempCount;

  return (
    <>
      <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          {/* Header with player name and history button */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">{playerName}</h2>
            <button
              onClick={handleOpenLog}
              className="flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-200 shadow-lg"
              title="Voir l'historique"
            >
              <History size={18} />
            </button>
          </div>

          {/* Displaying sticks */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mb-8 min-h-40 flex items-center justify-center">
            {tempCount === 0 ? (
              <p className="text-gray-500 text-lg">Aucun bâton</p>
            ) : (
              <div className="flex flex-wrap items-center justify-center">
                {renderSticks(tempCount)}
              </div>
            )}
          </div>

          {/* Numeric display for sticks */}
          <div className="text-center mb-8">
            <span className="text-4xl font-bold text-gray-800">
              {tempCount}
            </span>
            {hasChanges && (
              <div className="text-sm text-gray-500 mt-2">
                Sauvegardé: {currentSticks}
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            {/* REMOVE STICKS */}
            <button
              onClick={handleRemove}
              disabled={tempCount === 0}
              className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Minus size={20} />
            </button>

            {/* SAVE STICKS */}
            <button
              onClick={handleValidate}
              disabled={!hasChanges}
              className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Check size={20} />
            </button>

            {/* ADD STICKS */}
            <button
              onClick={handleAdd}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* StickLog Modal */}
      <StickLog
        isOpen={isLogOpen}
        onClose={handleCloseLog}
        playerName={playerName}
        sticks={sticks}
      />
    </>
  );
};

export default StickCounter;
