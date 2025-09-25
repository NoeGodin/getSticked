// noinspection JSIgnoredPromiseFromCall

import { useEffect, useState } from "react";
import { Check, Settings, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ItemCounter from "./ItemCounter.tsx";
import SinglePlayerView from "./SinglePlayerView.tsx";
import PlayerListView from "./PlayerListView.tsx";
import RoomHistoryWidget from "./RoomHistoryWidget.tsx";
import RoomSettings from "./RoomSettings.tsx";
import type { Player, Room } from "../types/room.types";
import type { ItemType, UserItem } from "../types/item-type.types";
import { RoomService } from "../services/room.service.ts";
import { UserService } from "../services/user.service.ts";
import { InvitationService } from "../services/invitation.service.ts";
import { ItemTypeService } from "../services/item-type.service.ts";

const StickRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [virtualPlayers, setVirtualPlayers] = useState<Player[]>([]);
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<
    "multi" | "single" | "list" | "settings"
  >("multi");

  // Load virtual players based on room members
  const loadVirtualPlayers = async (roomData: Room) => {
    if (!roomData.memberIds || roomData.memberIds.length === 0) {
      setVirtualPlayers([]);
      return;
    }

    try {
      const playersPromises = roomData.memberIds.map(async (memberId) => {
        try {
          const memberData = await UserService.getUserById(memberId);

          // Always use the new item system
          const { UserRoomItemsService } = await import(
            "../services/userRoomItems.service"
          );
          const memberItems = await UserRoomItemsService.getUserRoomItems(
            memberId,
            roomData.id!
          );

          return {
            id: memberId,
            name: memberData?.displayName || "Utilisateur inconnu",
            sticks: [], // Keep for compatibility but always empty
            items: memberItems?.items || ([] as UserItem[]),
            photoURL: memberData?.photoURL,
            bio: memberData?.bio,
          };
        } catch (error) {
          console.warn(`Error loading member ${memberId}:`, error);
          return {
            id: memberId,
            name: "Utilisateur inconnu",
            sticks: [],
            items: [] as UserItem[],
            photoURL: undefined,
            bio: undefined,
          };
        }
      });

      const players = await Promise.all(playersPromises);
      setVirtualPlayers(players);
    } catch (error) {
      console.error("Error loading virtual players:", error);
      setVirtualPlayers([]);
    }
  };

  // Load room data on component mount
  useEffect(() => {
    const loadRoomData = async () => {
      if (!roomId || !user) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const roomData = await RoomService.getRoomByIdLight(roomId);

        if (!roomData) {
          setError("StickRoom not found");
          return;
        }

        setRoom(roomData);

        // Load item type (mandatory now)
        if (roomData.itemTypeId) {
          try {
            const type = await ItemTypeService.getTypeById(roomData.itemTypeId);
            setItemType(type);
          } catch (error) {
            console.error("Error loading item type:", error);
            setError("Type d'item introuvable");
            return;
          }
        } else {
          console.error("Room has no itemTypeId");
          setError("Type d'item manquant");
          return;
        }

        // Check if user accessed via invitation link and auto-join if not already joined
        const userData = await UserService.getUserById(user.uid);
        const isOwner = roomData.owner.uid === user.uid;
        const isAlreadyJoined =
          userData?.joinedRooms?.includes(roomId) || false;

        if (!isOwner && !isAlreadyJoined) {
          try {
            await UserService.addRoomToUser(user.uid, roomId);
            console.log("User automatically joined room via invitation link");
          } catch (error) {
            console.error("Error auto-joining room:", error);
          }
        }

        // Ensure user is in memberIds and has userRoomItems entry
        let updatedRoomData = roomData;
        if (!roomData.memberIds.includes(user.uid)) {
          // Add user to room memberIds
          await RoomService.updateRoom(roomId, {
            memberIds: [...roomData.memberIds, user.uid],
          });
          // Update local room data
          updatedRoomData = {
            ...roomData,
            memberIds: [...roomData.memberIds, user.uid],
          };
          setRoom(updatedRoomData);
        }

        // Ensure user has an entry in userRoomItems
        try {
          const { UserRoomItemsService } = await import(
            "../services/userRoomItems.service"
          );
          await UserRoomItemsService.joinRoom(user.uid, roomId);
        } catch (error) {
          console.warn("Error ensuring user room items entry:", error);
        }

        // Charger les joueurs virtuels basés sur les membres (use updated room data)
        await loadVirtualPlayers(updatedRoomData);
      } catch (err) {
        console.error("Error loading room:", err);
        setError("Error loading room data");
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId, user, navigate]);

  // Determine view mode based on number of members
  useEffect(() => {
    if (virtualPlayers.length > 4) {
      setViewMode("list");
    } else {
      setViewMode("multi");
    }
  }, [virtualPlayers]);

  const handleSticksUpdate = async (playerId: string) => {
    if (!room?.id || !user) return;

    if (playerId !== user.uid) {
      console.error(
        "Tentative de modification des bâtons d'un autre utilisateur"
      );
      return;
    }

    try {
      const updatedRoom = await RoomService.getRoomByIdLight(room.id);
      if (updatedRoom) {
        setRoom(updatedRoom);
        await loadVirtualPlayers(updatedRoom);
      }
    } catch (error) {
      console.error("Error updating sticks:", error);
    }
  };

  const handleItemsUpdate = async (playerId: string) => {
    if (!room?.id || !user) return;

    if (playerId !== user.uid) {
      console.error(
        "Tentative de modification des items d'un autre utilisateur"
      );
      return;
    }

    try {
      const updatedRoom = await RoomService.getRoomByIdLight(room.id);
      if (updatedRoom) {
        setRoom(updatedRoom);
        await loadVirtualPlayers(updatedRoom);
      }
    } catch (error) {
      console.error("Error updating items:", error);
    }
  };

  const handleShareInvitation = async () => {
    if (!room?.id || !user) {
      console.error("Missing room or user:", {
        roomId: room?.id,
        userId: user?.uid,
      });
      return;
    }

    console.log(
      "Creating invitation for room:",
      room.id,
      "by user:",
      user.displayName
    );

    try {
      const invitationData = await InvitationService.createInvitation(
        { roomId: room.id },
        user
      );

      console.log("Invitation created:", invitationData);

      // Copy URL to clipboard
      await navigator.clipboard.writeText(invitationData.url);
      console.log("URL copied to clipboard:", invitationData.url);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to create invitation:", error);
      alert("Erreur lors de la création du lien d'invitation: " + error);
    }
  };

  const handlePlayerSelect = async (playerId: string) => {
    if (!room) return;

    try {
      // Créer un "joueur" virtuel basé sur les données du membre avec le nouveau système
      const { UserService } = await import("../services/user.service");
      const { UserRoomItemsService } = await import(
        "../services/userRoomItems.service"
      );

      const memberData = await UserService.getUserById(playerId);
      const memberItems = await UserRoomItemsService.getUserRoomItems(
        playerId,
        room.id!
      );

      const virtualPlayer: Player = {
        id: playerId,
        name: memberData?.displayName || "Utilisateur inconnu",
        items: memberItems?.items || [],
        photoURL: memberData?.photoURL,
        bio: memberData?.bio,
      };

      setSelectedPlayer(virtualPlayer);
      setViewMode("single");
    } catch (error) {
      console.error("Error selecting player:", error);
    }
  };

  const handleBackToList = () => {
    setSelectedPlayer(null);
    setViewMode(virtualPlayers.length > 4 ? "list" : "multi");
  };

  const handleShowSettings = () => {
    setViewMode("settings");
  };

  const handleBackFromSettings = () => {
    setViewMode(virtualPlayers.length > 4 ? "list" : "multi");
  };

  const handleRoomUpdate = (updatedRoom: Room) => {
    setRoom(updatedRoom);
  };

  const handleLeaveRoom = () => {
    navigate("/");
  };

  // Single player view when selected
  if (viewMode === "single" && selectedPlayer && room) {
    return (
      <SinglePlayerView
        player={selectedPlayer}
        roomId={room.id}
        room={room}
        virtualPlayers={virtualPlayers}
        onBack={handleBackToList}
        onSticksUpdate={handleSticksUpdate}
      />
    );
  }

  // Settings view
  if (viewMode === "settings" && room) {
    return (
      <RoomSettings
        room={room}
        onBack={handleBackFromSettings}
        onRoomUpdate={handleRoomUpdate}
        onLeaveRoom={handleLeaveRoom}
        onRoomDeleted={() => navigate("/")}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement de la room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "StickRoom not found"}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const isOwner = room?.owner?.uid === user?.uid;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-3 py-2">
        {/* StickRoom name and description */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {room.name}
            </h1>
            {isOwner && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Propriétaire
              </span>
            )}
          </div>
          {room.description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 break-words">
              {room.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-1">
            {isOwner && (
              <button
                onClick={handleShowSettings}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs sm:text-sm transition-colors"
                title="Paramètres de la room"
              >
                <Settings size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Paramètres</span>
              </button>
            )}
            <button
              onClick={handleShareInvitation}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              title="Partager le lien d'invitation"
            >
              {copied ? (
                <>
                  <Check size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Copié !</span>
                </>
              ) : (
                <>
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Inviter</span>
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-2 sm:px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs sm:text-sm transition-colors"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {viewMode === "list" ? (
          // Player list view for 4+ players
          <div className="flex-1 flex items-center justify-center p-4">
            <PlayerListView
              players={virtualPlayers}
              onPlayerClick={handlePlayerSelect}
              room={room}
              itemType={itemType || undefined}
              currentUserId={user?.uid}
            />
          </div>
        ) : (
          // Multi-counter view for 2-4 players
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`grid gap-4 sm:gap-6 w-full max-w-6xl p-2 sm:p-4 ${
                virtualPlayers.length === 1
                  ? "grid-cols-1 max-w-md"
                  : virtualPlayers.length === 2
                    ? "grid-cols-1 md:grid-cols-2"
                    : virtualPlayers.length === 3
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {virtualPlayers.map((player) => {
                return itemType ? (
                  <ItemCounter
                    key={player.id}
                    playerName={player.name}
                    items={player.items || []}
                    roomId={room.id!}
                    player={player.id}
                    onItemsUpdate={() => handleItemsUpdate(player.id)}
                    playerPhotoURL={player.photoURL}
                    itemType={itemType!}
                  />
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* History Widget */}
        <RoomHistoryWidget room={room} />
      </div>
    </div>
  );
};

export default StickRoom;
