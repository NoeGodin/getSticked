// noinspection JSIgnoredPromiseFromCall

import { useEffect, useState } from "react";
import { Check, Settings, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import StickCounter from "./StickCounter.tsx";
import SinglePlayerView from "./SinglePlayerView.tsx";
import PlayerListView from "./PlayerListView.tsx";
import RoomHistoryWidget from "./RoomHistoryWidget.tsx";
import RoomSettings from "./RoomSettings.tsx";
import type { Stick } from "../types/stick.types.ts";
import type { Player, Room } from "../types/room.types";
import { RoomService } from "../services/room.service.ts";
import { copyInvitationLink } from "../utils/invitation.ts";

const DualStickCounter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<
    "multi" | "single" | "list" | "settings"
  >("multi");

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
        const roomData = await RoomService.getRoomById(roomId);
        
        if (!roomData) {
          setError("Room not found");
          return;
        }

        setRoom(roomData);
      } catch (err) {
        console.error("Error loading room:", err);
        setError("Error loading room data");
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId, user, navigate]);

  // Determine view mode based on number of players
  useEffect(() => {
    if (room) {
      if (room.players.length > 4) {
        setViewMode("list");
      } else {
        setViewMode("multi");
      }
    }
  }, [room]);

  const handleSticksUpdate = async (playerId: string, newSticks: Stick[]) => {
    if (!room?.id || !user) return;

    try {
      // Update Firebase
      await RoomService.updatePlayerSticks(room.id, playerId, newSticks, user);

      // Update local state
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;
        return {
          ...prevRoom,
          players: prevRoom.players.map((player) =>
            player.id === playerId ? { ...player, sticks: newSticks } : player,
          ),
        };
      });
    } catch (error) {
      console.error("Error updating sticks:", error);
    }
  };

  const handleShareInvitation = async () => {
    if (!room?.id) return;

    const success = await copyInvitationLink(room.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setViewMode("single");
  };

  const handleBackToList = () => {
    setSelectedPlayer(null);
    setViewMode(room && room.players.length > 4 ? "list" : "multi");
  };

  const handleShowSettings = () => {
    setViewMode("settings");
  };

  const handleBackFromSettings = () => {
    setViewMode(room && room.players.length > 4 ? "list" : "multi");
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
          <p className="text-red-600 mb-4">{error || "Room not found"}</p>
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
        {/* Room name and description */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {room.name}
            </h1>
            {isOwner && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Propriétaire</span>}
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
              players={room.players}
              onPlayerClick={handlePlayerSelect}
            />
          </div>
        ) : (
          // Multi-counter view for 2-4 players
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`grid gap-4 sm:gap-6 w-full max-w-6xl p-2 sm:p-4 ${
                room.players.length === 1
                  ? "grid-cols-1 max-w-md"
                  : room.players.length === 2
                    ? "grid-cols-1 md:grid-cols-2"
                    : room.players.length === 3
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {room.players.map((player) => (
                <StickCounter
                  key={player.id}
                  playerName={player.name}
                  sticks={player.sticks}
                  roomId={room.id}
                  player={player.id}
                  onSticksUpdate={(newSticks) =>
                    handleSticksUpdate(player.id, newSticks)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* History Widget */}
        <RoomHistoryWidget room={room} />
      </div>
    </div>
  );
};

export default DualStickCounter;