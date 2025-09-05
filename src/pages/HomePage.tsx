import React, { useEffect, useState } from "react";
import { Calendar, Crown, MessageSquare, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Room } from "../types/room.types";
import type { HomePageProps } from "../types/ui.types.ts";
import { RoomService } from "../services/room.service.ts";
import { formatShortDate, getTotalSticks } from "../utils/helpers.ts";
import type { UserSession } from "../types/session.types.ts";

const HomePage: React.FC<HomePageProps> = ({ userSession, setUserSession }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchRoomData = async (roomName: string): Promise<Room | null> => {
      try {
        const joinedRoom = userSession.joinedRooms.find(
          (jr) => jr.name === roomName,
        );
        if (!joinedRoom) return null;

        return await RoomService.joinRoom({
          name: joinedRoom.name,
          secretKey: joinedRoom.secretKey,
        });
      } catch (error) {
        console.error(`Error fetching room ${roomName}:`, error);
        return null;
      }
    };

    const loadRooms = async () => {
      setLoading(true);
      const roomPromises = userSession.joinedRooms.map((joinedRoom) =>
        fetchRoomData(joinedRoom.name),
      );

      try {
        const roomResults = await Promise.all(roomPromises);
        const validRooms = roomResults.filter(
          (room): room is Room => room !== null,
        );
        setRooms(validRooms);
      } catch (error) {
        console.error("Error loading rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [userSession.joinedRooms]);

  const handleRoomClick = (room: Room) => {
    const currentSession = JSON.parse(
      localStorage.getItem("userSession") ||
        '{"joinedRooms":[],"currentRoomName":null}',
    ) as UserSession;
    setUserSession({
      ...currentSession,
      currentRoomName: room.name,
    });

    navigate("/game");
  };

  const calculateTotalSticks = (room: Room) => {
    const playerTotals = room.players.map(player => ({
      id: player.id,
      name: player.name,
      total: getTotalSticks(player.sticks)
    }));
    
    // Sort by stick count descending
    const sortedPlayers = playerTotals.sort((a, b) => b.total - a.total);
    
    // Mark player(s) with the most sticks
    const maxSticks = sortedPlayers.length > 0 ? sortedPlayers[0].total : 0;
    const playersWithLeaderInfo = sortedPlayers.map(player => ({
      ...player,
      isLeader: player.total === maxSticks && maxSticks > 0
    }));
    
    return {
      players: playersWithLeaderInfo,
      total: playerTotals.reduce((sum, player) => sum + player.total, 0),
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">GetSticked</h1>
          <p className="text-gray-600">
            Crée un salon pour n’importe quelle compétition entre 2 amis !
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => navigate("/create")}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transition-colors duration-200"
          >
            <Plus size={20} />
            <span>Créer un salon</span>
          </button>
          <button
            onClick={() => navigate("/join")}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-colors duration-200"
          >
            <Users size={20} />
            <span>Rejoindre un salon</span>
          </button>
        </div>

        {/* Room Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : rooms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Aucun salon rejoint
              </h3>
              <p className="text-gray-500 mb-6">
                Créez votre premier salon ou rejoignez-en un existant
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate("/create")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Créer un salon
                </button>
                <button
                  onClick={() => navigate("/join")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Rejoindre un salon
                </button>
              </div>
            </div>
          ) : (
            rooms
              .sort((a, b) => {
                // Sort by modification date descending (most recent first)
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
                return dateB - dateA;
              })
              .map((room) => {
              const stickCounts = calculateTotalSticks(room);
              const joinedRoom = userSession.joinedRooms.find(
                (jr) => jr.name === room.name,
              );

              return (
                <div
                  key={room.name}
                  onClick={() => handleRoomClick(room)}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 line-clamp-1">
                        {room.name}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {stickCounts.total} bâtons
                      </span>
                    </div>

                    {room.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {stickCounts.players.map((player) => (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {player.isLeader && (
                              <Crown size={14} className="text-yellow-500 flex-shrink-0" />
                            )}
                            <span className="text-gray-700 font-medium">
                              {player.name}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            player.isLeader 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {player.total} bâtons
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>
                          Rejoint le{" "}
                          {formatShortDate(
                            joinedRoom?.joinedAt || room.createdAt,
                          )}
                        </span>
                      </div>
                      {room.updatedAt && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare size={12} />
                          <span>MAJ {formatShortDate(room.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
