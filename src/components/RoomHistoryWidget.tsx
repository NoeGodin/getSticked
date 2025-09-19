import React, { useMemo, useState } from "react";
import { Clock, User, MessageSquare, Plus, Minus, ChevronDown } from "lucide-react";
import type { Room } from "../types/room.types";
import type { Stick } from "../types/stick.types";

interface RoomHistoryWidgetProps {
  room: Room;
  currentPlayerId?: string; // When specified, only show history for this player
}

interface HistoryEntry extends Stick {
  playerName: string;
  playerId: string;
}

const RoomHistoryWidget: React.FC<RoomHistoryWidgetProps> = ({ room, currentPlayerId }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  // Combine all sticks from all players with player information
  const allHistoryEntries = useMemo((): HistoryEntry[] => {
    const allEntries: HistoryEntry[] = [];
    
    // If currentPlayerId is specified, only show history for that player
    const playersToInclude = currentPlayerId 
      ? room.players.filter(player => player.id === currentPlayerId)
      : room.players;
    
    playersToInclude.forEach(player => {
      player.sticks.forEach(stick => {
        allEntries.push({
          ...stick,
          playerName: player.name,
          playerId: player.id
        });
      });
    });
    
    // Sort by creation date, most recent first
    return allEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [room.players, currentPlayerId]);

  const visibleEntries = allHistoryEntries.slice(0, visibleCount);
  const hasMoreEntries = allHistoryEntries.length > visibleCount;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) {
      return "À l'instant";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getActionIcon = (stick: HistoryEntry) => {
    if (stick.isRemoved) {
      return <Minus size={12} className="text-red-500 flex-shrink-0" />;
    }
    return <Plus size={12} className="text-green-500 flex-shrink-0" />;
  };

  const getActionText = (stick: HistoryEntry): string => {
    if (stick.isRemoved) {
      return `a retiré ${Math.abs(stick.count)} bâton${Math.abs(stick.count) !== 1 ? 's' : ''}`;
    }
    return `a ajouté ${stick.count} bâton${stick.count !== 1 ? 's' : ''}`;
  };

  const loadMoreEntries = () => {
    setVisibleCount(prev => prev + 20);
  };

  if (allHistoryEntries.length === 0) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-gray-500 mb-3">
          <Clock size={16} />
          <h3 className="font-medium text-sm">Historique</h3>
        </div>
        <p className="text-gray-400 text-sm text-center py-4">
          Aucune activité pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="p-4">
        <div className="flex items-center space-x-2 text-gray-700 mb-4">
          <Clock size={16} />
          <h3 className="font-medium text-sm">Historique</h3>
          <span className="text-xs text-gray-500">
            ({allHistoryEntries.length} action{allHistoryEntries.length !== 1 ? 's' : ''})
          </span>
        </div>
        
        <div className="space-y-2">
          {visibleEntries.map((entry, index) => (
            <div
              key={`${entry.playerId}-${entry.createdAt}-${index}`}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              {/* Action Icon */}
              {getActionIcon(entry)}
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 text-sm">
                  <User size={10} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-900 truncate">
                    {entry.playerName}
                  </span>
                  <span className="text-gray-600">
                    {getActionText(entry)}
                  </span>
                </div>
                
                {entry.comment && (
                  <div className="flex items-center space-x-1 mt-1">
                    <MessageSquare size={10} className="text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-600 italic truncate">
                      "{entry.comment}"
                    </p>
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="text-xs text-gray-400 flex-shrink-0">
                {formatDate(entry.createdAt)}
              </div>
            </div>
          ))}
        </div>

        {hasMoreEntries && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMoreEntries}
              className="flex items-center space-x-2 mx-auto px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              <ChevronDown size={14} />
              <span>Charger plus</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomHistoryWidget;