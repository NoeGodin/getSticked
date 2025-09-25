// noinspection GrazieInspection

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import ItemCounter from "./ItemCounter.tsx";
import RoomHistoryWidget from "./RoomHistoryWidget.tsx";
import type { Player, Room } from "../types/room.types";
import type { ItemType, UserItem } from "../types/item-type.types";
import { ItemTypeService } from "../services/item-type.service";
import { UserRoomItemsService } from "../services/userRoomItems.service";

interface SinglePlayerViewProps {
  player: Player;
  roomId?: string;
  room: Room;
  virtualPlayers?: Player[]; // Joueurs virtuels pour le nouveau modèle
  onBack: () => void;
  onSticksUpdate: (playerId: string) => void; // Simplifié car plus besoin de passer newSticks
}

const SinglePlayerView: React.FC<SinglePlayerViewProps> = ({
  player,
  roomId,
  room,
  virtualPlayers,
  onBack,
  onSticksUpdate,
}) => {
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [playerItems, setPlayerItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger item type and player type
  useEffect(() => {
    const loadData = async () => {
      if (!room.itemTypeId || !roomId) return;

      try {
        const type = await ItemTypeService.getTypeById(room.itemTypeId);
        setItemType(type);

        const userRoomItems = await UserRoomItemsService.getUserRoomItems(
          player.id,
          roomId
        );
        setPlayerItems(userRoomItems?.items || []);
      } catch (error) {
        console.error("Error loading single player data:", error);
      } finally {
        setLoading(false);
      }
    };

    // noinspection JSIgnoredPromiseFromCall
    loadData();
  }, [room.itemTypeId, roomId, player.id]);

  const handleItemsUpdate = async () => {
    // reload item after update
    if (roomId) {
      try {
        const userRoomItems = await UserRoomItemsService.getUserRoomItems(
          player.id,
          roomId
        );
        setPlayerItems(userRoomItems?.items || []);

        // reload parent
        onSticksUpdate(player.id);
      } catch (error) {
        console.error("Error refreshing items:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!itemType) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Type d'item introuvable</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

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
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-800">{player.name}</h1>
          <span className="text-sm text-gray-500">{itemType.name}</span>
        </div>
        <div /> {/* Spacer for centering */}
      </div>

      {/* Content Area */}
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {/* Single Player Counter */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ItemCounter
              playerName={player.name}
              items={playerItems}
              roomId={roomId || ""}
              player={player.id}
              onItemsUpdate={handleItemsUpdate}
              hideHistoryIcon={(virtualPlayers || []).length > 4}
              playerPhotoURL={player.photoURL}
              itemType={itemType}
            />
          </div>
        </div>

        {/* History Widget - Show only current player's history when room has > 4 players */}
        <RoomHistoryWidget
          room={room}
          virtualPlayers={virtualPlayers}
          currentPlayerId={
            (virtualPlayers || []).length > 4 ? player.id : undefined
          }
        />
      </div>
    </div>
  );
};

export default SinglePlayerView;
