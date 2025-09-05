import React from "react";
import { ArrowLeft } from "lucide-react";
import StickCounter from "./StickCounter.tsx";
import type { Player } from "../types/room.types";
import type { Stick } from "../types/stick.types";

interface SinglePlayerViewProps {
  player: Player;
  roomId?: string;
  onBack: () => void;
  onSticksUpdate: (playerId: string, newSticks: Stick[]) => void;
}

const SinglePlayerView: React.FC<SinglePlayerViewProps> = ({
  player,
  roomId,
  onBack,
  onSticksUpdate,
}) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>
        </div>
        <h1 className="text-lg font-semibold text-gray-800">
          {player.name}
        </h1>
        <div /> {/* Spacer for centering */}
      </div>

      {/* Single Player Counter */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <StickCounter
            playerName={player.name}
            sticks={player.sticks}
            roomId={roomId}
            player={player.id}
            onSticksUpdate={(newSticks) => onSticksUpdate(player.id, newSticks)}
          />
        </div>
      </div>
    </div>
  );
};

export default SinglePlayerView;