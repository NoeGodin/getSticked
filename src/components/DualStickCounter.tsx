// noinspection JSIgnoredPromiseFromCall

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StickCounter from "./StickCounter.tsx";
import type { Stick } from "../types/stick.types.ts";
import type { UserSession } from "../types/session.types";
import type { Room } from "../types/room.types";
import { RoomService } from "../services/room.service.ts";

interface DualStickCounterProps {
  userSession: UserSession;
  // eslint-disable-next-line
  getCurrentRoom?: () => any; // Function to get current room data
}

const DualStickCounter: React.FC<DualStickCounterProps> = ({ userSession }) => {
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load room data on component mount
  useEffect(() => {
    const loadRoomData = async () => {
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

        setRoom(roomData);
      } catch (err) {
        console.error("Error loading room:", err);
        setError("Error loading room data");
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [userSession.currentRoomName, userSession.joinedRooms, navigate]);

  const handleSticksUpdate = async (
    player: "player1" | "player2",
    newSticks: Stick[],
  ) => {
    if (!room?.id) return;

    try {
      // Update room data with new sticks
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;
        return {
          ...prevRoom,
          batons: {
            ...prevRoom.batons,
            [player]: newSticks,
          },
        };
      });
    } catch (error) {
      console.error("Error updating sticks:", error);
    }
  };

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

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
        >
          Retour
        </button>
      </div>

      {/* Game Area */}
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-6xl p-2 sm:p-4">
          {/* Player 1 */}
          <StickCounter
            playerName={room.player1Name}
            sticks={room.batons.player1}
            roomId={room.id}
            player="player1"
            onSticksUpdate={(newSticks) =>
              handleSticksUpdate("player1", newSticks)
            }
          />

          {/* Player 2 */}
          <StickCounter
            playerName={room.player2Name}
            sticks={room.batons.player2}
            roomId={room.id}
            player="player2"
            onSticksUpdate={(newSticks) =>
              handleSticksUpdate("player2", newSticks)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DualStickCounter;
