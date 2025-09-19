import React from "react";
import { ArrowLeft } from "lucide-react";
import StickCounter from "./StickCounter.tsx";
import RoomHistoryWidget from "./RoomHistoryWidget.tsx";
import type { Player, Room } from "../types/room.types";
import type { Stick } from "../types/stick.types";

interface SinglePlayerViewProps {
  player: Player;
  roomId?: string;
  room: Room;
  onBack: () => void;
  onSticksUpdate: (playerId: string, newSticks: Stick[]) => void;
}

const SinglePlayerView: React.FC<SinglePlayerViewProps> = ({
  player,
  roomId,
  room,
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

      {/* Content Area */}
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {/* Single Player Counter */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <StickCounter
              playerName={player.name}
              sticks={player.sticks}
              roomId={roomId}
              player={player.id}
              onSticksUpdate={(newSticks) => onSticksUpdate(player.id, newSticks)}
              hideHistoryIcon={room.players.length > 4}
            />
          </div>
        </div>

        {/* History Widget - Show only current player's history when room has > 4 players */}
        <RoomHistoryWidget 
          room={room} 
          currentPlayerId={room.players.length > 4 ? player.id : undefined} 
        />
      </div>
    </div>
  );
};

export default SinglePlayerView;