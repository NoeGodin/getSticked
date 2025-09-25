// noinspection GrazieInspection

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  Clock,
  MessageSquare,
  Minus,
  Plus,
  User,
} from "lucide-react";
import type { Room } from "../types/room.types";
import type { ItemType, UserItem } from "../types/item-type.types";
import { UserRoomItemsService } from "../services/userRoomItems.service";
import { ItemTypeService } from "../services/item-type.service";
import { UserService } from "../services/user.service";

interface RoomHistoryWidgetProps {
  room: Room;
  currentPlayerId?: string; // When specified, only show history for this player
}

interface HistoryEntry {
  id: string;
  optionId: string;
  optionName: string;
  optionEmoji: string;
  optionPoints: number;
  count: number;
  comment?: string;
  createdAt: string;
  isRemoved?: boolean;
  playerName: string;
  playerId: string;
}

const RoomHistoryWidget: React.FC<RoomHistoryWidgetProps> = ({
  room,
  currentPlayerId,
}) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history data
  useEffect(() => {
    const loadHistory = async () => {
      if (!room.id) return;

      try {
        setLoading(true);

        // Get room's item type
        let roomItemType: ItemType | null = null;
        if (room.itemTypeId) {
          const availableTypes = await ItemTypeService.getAvailableTypes();
          roomItemType =
            availableTypes.find((type) => type.id === room.itemTypeId) || null;
        }

        if (!roomItemType) {
          setHistoryEntries([]);
          return;
        }

        // Get all user items for this room
        const allUserItems = await UserRoomItemsService.getAllRoomItems(
          room.id
        );

        // Build history entries
        const entries: HistoryEntry[] = [];

        for (const userRoomItems of allUserItems) {
          // Skip if currentPlayerId is specified and this isn't the right player
          if (currentPlayerId && userRoomItems.userId !== currentPlayerId) {
            continue;
          }

          // Get user name
          let playerName = "Utilisateur inconnu";
          try {
            const userData = await UserService.getUserById(
              userRoomItems.userId
            );
            playerName = userData?.displayName || "Utilisateur inconnu";
          } catch (error) {
            console.warn(`Error loading user ${userRoomItems.userId}:`, error);
          }

          // Add each item as a history entry
          userRoomItems.items.forEach((item: UserItem) => {
            const option = roomItemType.options.find(
              (opt) => opt.id === item.optionId
            );
            if (!option) return;

            entries.push({
              id: item.id,
              optionId: item.optionId,
              optionName: option.name,
              optionEmoji: option.emoji,
              optionPoints: option.points,
              count: item.count || 1,
              comment: item.comment,
              createdAt: item.createdAt,
              isRemoved: item.isRemoved,
              playerName,
              playerId: userRoomItems.userId,
            });
          });
        }

        // Sort by creation date, most recent first
        entries.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setHistoryEntries(entries);
      } catch (error) {
        console.error("Error loading history:", error);
        setHistoryEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    // Listen for history updates
    const handleHistoryUpdate = (event: CustomEvent) => {
      if (event.detail.roomId === room.id) {
        loadHistory();
      }
    };

    window.addEventListener('roomHistoryUpdated', handleHistoryUpdate as EventListener);
    
    return () => {
      window.removeEventListener('roomHistoryUpdated', handleHistoryUpdate as EventListener);
    };
  }, [room.id, room.itemTypeId, currentPlayerId]);

  const visibleEntries = historyEntries.slice(0, visibleCount);
  const hasMoreEntries = historyEntries.length > visibleCount;

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
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const getActionIcon = (entry: HistoryEntry) => {
    if (entry.isRemoved) {
      return <Minus size={12} className="text-red-500 flex-shrink-0" />;
    }
    return <Plus size={12} className="text-green-500 flex-shrink-0" />;
  };

  const getActionText = (entry: HistoryEntry): string => {
    const itemText = `${entry.count} ${entry.optionEmoji} ${entry.optionName.toLowerCase()}${entry.count !== 1 ? "s" : ""}`;
    const pointsText = `(${entry.count * entry.optionPoints} point${entry.count * entry.optionPoints !== 1 ? "s" : ""})`;

    if (entry.isRemoved) {
      return `a retiré ${itemText} ${pointsText}`;
    }
    return `a ajouté ${itemText} ${pointsText}`;
  };

  const loadMoreEntries = () => {
    setVisibleCount((prev) => prev + 20);
  };

  if (loading) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-gray-500 mb-3">
          <Clock size={16} />
          <h3 className="font-medium text-sm">Historique</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (historyEntries.length === 0) {
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
            ({historyEntries.length} action
            {historyEntries.length !== 1 ? "s" : ""})
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
                  <span className="text-gray-600">{getActionText(entry)}</span>
                </div>

                {entry.comment && (
                  <div className="flex items-center space-x-1 mt-1">
                    <MessageSquare
                      size={10}
                      className="text-gray-400 flex-shrink-0"
                    />
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
