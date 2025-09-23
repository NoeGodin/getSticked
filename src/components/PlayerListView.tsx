import React from "react";
import { Crown, Users, ChevronRight } from "lucide-react";
import Avatar from "./Avatar";
import type { Player } from "../types/room.types";
import { getTotalSticks } from "../utils/helpers";

interface PlayerListViewProps {
  players: Player[];
  onPlayerClick: (playerId: string) => void;
}

const PlayerListView: React.FC<PlayerListViewProps> = ({
  players,
  onPlayerClick,
}) => {
  // Calculate totals and sort by stick count
  const playersWithTotals = players
    .map((player) => ({
      ...player,
      total: getTotalSticks(player.sticks),
    }))
    .sort((a, b) => b.total - a.total);

  const maxSticks =
    playersWithTotals.length > 0 ? playersWithTotals[0].total : 0;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-gray-700">
            <Users size={24} />
            <h2 className="text-xl font-semibold">
              Joueurs ({players.length})
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Cliquez sur un joueur pour voir son compteur
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {playersWithTotals.map((player, index) => (
            <button
              key={player.id}
              onClick={() => onPlayerClick(player.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {player.total === maxSticks && maxSticks > 0 && (
                    <Crown
                      size={18}
                      className="text-yellow-500 flex-shrink-0"
                    />
                  )}
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {index + 1}
                  </div>
                </div>

                <Avatar 
                  photoURL={player.photoURL}
                  displayName={player.name}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{player.name}</h3>
                  <p className="text-sm text-gray-500">
                    {player.sticks.length} action
                    {player.sticks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div
                    className={`text-lg font-semibold ${
                      player.total === maxSticks && maxSticks > 0
                        ? "text-yellow-600"
                        : "text-gray-900"
                    }`}
                  >
                    {player.total}
                  </div>
                  <div className="text-xs text-gray-500">bâtons</div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerListView;
