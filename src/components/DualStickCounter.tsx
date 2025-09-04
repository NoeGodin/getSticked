import React from "react";
import { useNavigate } from "react-router-dom";
import StickCounter from "./StickCounter.tsx";
import type { Stick } from "../types/stick.types.ts";
import type { UserSession } from "../types/session.types";

interface DualStickCounterProps {
  userSession: UserSession;
  getCurrentRoom?: () => any; // Function to get current room data
  player1Sticks?: Stick[];
  player2Sticks?: Stick[];
}

const DualStickCounter: React.FC<DualStickCounterProps> = ({
  userSession,
  getCurrentRoom,
  player1Sticks = [],
  player2Sticks = [],
}) => {
  const navigate = useNavigate();
  const currentRoom = getCurrentRoom?.();

  // Get player names from room data or fallback to defaults
  const player1Name = currentRoom?.player1Name || "Joueur 1";
  const player2Name = currentRoom?.player2Name || "Joueur 2";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-2 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {userSession.currentRoomName}
          </h1>
          {currentRoom?.description && (
            <p className="text-sm text-gray-600 mt-1">
              {currentRoom.description}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
        >
          Retour
        </button>
      </div>

      {/* Game Area */}
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-6xl p-2 sm:p-4">
          {/* Player 1 */}
          <StickCounter playerName={player1Name} sticks={player1Sticks} />

          {/* Player 2 */}
          <StickCounter playerName={player2Name} sticks={player2Sticks} />
        </div>
      </div>
    </div>
  );
};

export default DualStickCounter;
