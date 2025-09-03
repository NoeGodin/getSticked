import React, { useState } from "react";
import { Check, History, Minus, Plus } from "lucide-react";
import StickLog from "./StickLog";
import type { StickCounterProps } from "../types/ui.types";
import { getTotalSticks } from "../utils/helpers.ts";

const StickCounter: React.FC<StickCounterProps> = ({ playerName, sticks }) => {
  const totalSticks = getTotalSticks(sticks);

  sticks.reduce((sum, stick) => sum + stick.count, 0);
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
        <div key={`group-${i}`} className="relative inline-block mx-1 sm:mx-2">
          {/* the 4 vertical bar */}
          <div className="flex space-x-0.5 sm:space-x-1">
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="w-0.5 sm:w-1 h-8 sm:h-12 bg-gray-800 rounded-sm"
              />
            ))}
          </div>
          {/* diagonal bar */}
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="w-5 sm:w-8 h-0.5 bg-gray-800 rotate-45 transform origin-center" />
          </div>
        </div>,
      );
    }

    // This one renders the remainder sticks (1 to 4)
    if (remainder > 0) {
      sticks.push(
        <div
          key="remainder"
          className="flex space-x-0.5 mx-0.5 sm:mx-1 md:mx-2"
        >
          {[...Array(remainder)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 sm:w-1 h-6 sm:h-8 md:h-12 bg-gray-800 rounded-sm"
            />
          ))}
        </div>,
      );
    }

    return sticks;
  };

  const hasChanges = currentSticks !== tempCount;

  return (
    <>
      <div className="flex flex-col items-center p-2 sm:p-4 lg:p-8 bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md">
          {/* Header with player name and history button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate mr-2">
              {playerName}
            </h2>
            <button
              onClick={handleOpenLog}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-200 shadow-lg"
              title="Voir l'historique"
            >
              <History size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* Displaying sticks */}
          <div
            className="bg-white border-2 border-gray-300 rounded-lg
                p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8
                h-32 sm:h-40 lg:h-56  /* responsive */
                flex items-center justify-center
                overflow-y-auto"
          >
            {tempCount === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg">
                Aucun bâton
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-center">
                {renderSticks(tempCount)}
              </div>
            )}
          </div>

          {/* Numeric display for sticks */}
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              {tempCount}
            </span>
            <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 min-h-[1.25rem]">
              {hasChanges ? `Sauvegardé: ${currentSticks}` : ""}
            </div>
          </div>

          <div className="flex justify-center space-x-2 sm:space-x-4">
            {/* REMOVE STICKS */}
            <button
              onClick={handleRemove}
              disabled={tempCount === 0}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Minus size={16} className="sm:w-5 sm:h-5" />
            </button>

            {/* SAVE STICKS */}
            <button
              onClick={handleValidate}
              disabled={!hasChanges}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Check size={16} className="sm:w-5 sm:h-5" />
            </button>

            {/* ADD STICKS */}
            <button
              onClick={handleAdd}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg"
            >
              <Plus size={16} className="sm:w-5 sm:h-5" />
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
