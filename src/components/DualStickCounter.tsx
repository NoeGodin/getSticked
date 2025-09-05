// noinspection JSIgnoredPromiseFromCall

import React, { useEffect, useState } from "react";
import { Share2, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import StickCounter from "./StickCounter.tsx";
import SinglePlayerView from "./SinglePlayerView.tsx";
import PlayerListView from "./PlayerListView.tsx";
import RoomHistoryWidget from "./RoomHistoryWidget.tsx";
import type { Stick } from "../types/stick.types.ts";
import type { UserSession } from "../types/session.types";
import type { Room, Player } from "../types/room.types";
import { RoomService } from "../services/room.service.ts";
import { copyInvitationLink } from "../utils/invitation.ts";

interface DualStickCounterProps {
  userSession: UserSession;
  // eslint-disable-next-line
  getCurrentRoom?: () => any; // Function to get current room data
}

const DualStickCounter: React.FC<DualStickCounterProps> = ({ userSession }) => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<'multi' | 'single' | 'list'>('multi');

  // Load room data on component mount
  useEffect(() => {
    const loadRoomData = async () => {
      // Priority 1: Try to load from URL parameter (roomId)
      if (roomId) {
        try {
          setLoading(true);
          setError(null);

          const roomData = await RoomService.getRoomById(roomId);
          if (!roomData) {
            setError("Room not found");
            return;
          }

          // Check if user has access to this room
          const hasAccess = userSession.joinedRooms.some(
            jr => jr.name === roomData.name
          );

          if (!hasAccess) {
            // Add room to user session if not already there
            const newJoinedRoom = {
              name: roomData.name,
              secretKey: roomData.secretKey,
              joinedAt: new Date().toISOString(),
              lastVisited: new Date().toISOString(),
            };
            
            // This is a bit of a hack - we should ideally update through the parent
            const currentSession = { ...userSession };
            currentSession.joinedRooms.push(newJoinedRoom);
            currentSession.currentRoomName = roomData.name;
            
            localStorage.setItem('userSession', JSON.stringify(currentSession));
          }

          setRoom(roomData);
          return;
        } catch (err) {
          console.error("Error loading room by ID:", err);
          setError("Error loading room data");
          return;
        } finally {
          setLoading(false);
        }
      }

      // Priority 2: Fallback to legacy currentRoomName logic
      if (!userSession.currentRoomName) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const joinedRoom = userSession.joinedRooms.find(
          (jr) => jr.name === userSession.currentRoomName,
        );

        if (!joinedRoom) {
          setError("Room not found in joined rooms");
          return;
        }

        const roomData = await RoomService.joinRoom({
          name: joinedRoom.name,
          secretKey: joinedRoom.secretKey,
        });

        if (!roomData) {
          setError("Failed to load room data");
          return;
        }

        // If we have room data with ID, redirect to new URL format
        if (roomData.id) {
          navigate(`/room/${roomData.id}`, { replace: true });
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
  }, [roomId, userSession.currentRoomName, userSession.joinedRooms, userSession, navigate]);

  // Determine view mode based on number of players
  useEffect(() => {
    if (room) {
      if (room.players.length > 4) {
        setViewMode('list');
      } else {
        setViewMode('multi');
      }
    }
  }, [room]);

  const handleSticksUpdate = async (
    playerId: string,
    newSticks: Stick[],
  ) => {
    if (!room?.id) return;

    try {
      // Update room data with new sticks
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;
        return {
          ...prevRoom,
          players: prevRoom.players.map(player =>
            player.id === playerId
              ? { ...player, sticks: newSticks }
              : player
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
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setViewMode('single');
  };

  const handleBackToList = () => {
    setSelectedPlayer(null);
    setViewMode(room && room.players.length > 4 ? 'list' : 'multi');
  };

  // Single player view when selected
  if (viewMode === 'single' && selectedPlayer && room) {
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-2 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{room.name}</h1>
          {room.description && (
            <p className="text-sm text-gray-600 mt-1">{room.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShareInvitation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Partager le lien d'invitation"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>Inviter</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {viewMode === 'list' ? (
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
            <div className={`grid gap-4 sm:gap-6 w-full max-w-6xl p-2 sm:p-4 ${
              room.players.length === 1 ? 'grid-cols-1 max-w-md' :
              room.players.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              room.players.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2'
            }`}>
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
