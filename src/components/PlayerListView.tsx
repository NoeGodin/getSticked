import React from "react";
import { ChevronRight, Crown, Users, Shield } from "lucide-react";
import Avatar from "./Avatar";
import type { Player, Room } from "../types/room.types";
import type { ItemType } from "../types/item-type.types";
import { calculateUserTotals } from "../utils/helpers";

interface PlayerListViewProps {
  players: Player[];
  onPlayerClick: (playerId: string) => void;
  room?: Room;
  itemType?: ItemType;
  currentUserId?: string; // userId to have a special display
}

const PlayerListView: React.FC<PlayerListViewProps> = ({
  players,
  onPlayerClick,
  room,
  itemType,
  currentUserId,
}) => {
  // Calculate totals and sort by points
  const playersWithTotals = players
    .map((player) => {
      let total = 0;
      let totalItems = 0;
      let label = "points";

      if (itemType && player.items) {
        // Use the unified item type system with points
        const totals = calculateUserTotals(player.items, itemType);
        total = totals.totalPoints;
        totalItems = totals.totalItems;
        label = total === 1 ? "point" : "points";
      }

      return {
        ...player,
        total,
        totalItems,
        label,
      };
    })
    .sort((a, b) => b.total - a.total);

  const maxScore =
    playersWithTotals.length > 0 ? playersWithTotals[0].total : 0;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-700">
              <Users size={24} />
              <h2 className="text-xl font-semibold">
                Joueurs ({players.length})
              </h2>
            </div>
            {itemType && (
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                {itemType.name}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Cliquez sur un joueur pour voir son compteur
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Classement par points • Mode {itemType?.name || "personnalisé"}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {playersWithTotals.map((player, index) => {
            const isCurrentUser = currentUserId === player.id;
            const isOwner = room?.owner?.uid === player.id;
            return (
              <button
                key={player.id}
                onClick={() => onPlayerClick(player.id)}
                className={`w-full p-4 flex items-center justify-between transition-colors text-left ${
                  isCurrentUser
                    ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {player.total === maxScore && maxScore > 0 && (
                      <Crown
                        size={18}
                        className="text-yellow-500 flex-shrink-0"
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                        player.total === maxScore && maxScore > 0
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <Avatar
                    photoURL={player.photoURL}
                    displayName={player.name}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`font-medium truncate ${isCurrentUser ? "text-blue-700" : "text-gray-900"}`}
                      >
                        {player.name}
                      </h3>
                      {isOwner && (
                        <div title="Propriétaire de la room">
                          <Shield 
                            size={14} 
                            className="text-amber-500 flex-shrink-0" 
                          />
                        </div>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                          Vous
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {player.totalItems}{" "}
                      {player.totalItems === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        player.total === maxScore && maxScore > 0
                          ? "text-yellow-600"
                          : "text-gray-900"
                      }`}
                    >
                      {player.total}
                    </div>
                    <div className="text-xs text-gray-500">{player.label}</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerListView;
