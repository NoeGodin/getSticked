import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import JoinRoomForm from "./pages/JoinRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";
import type { UserSession } from "./types/session.types";
import type {
  CreateRoomForm as CreateRoomFormData,
  JoinRoomForm as JoinRoomFormData,
  Room,
} from "./types/room.types";
import { mockUserSession } from "./data/session.data.ts";

type AppView = "home" | "create-room" | "join-room" | "game";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [userSession, setUserSession] = useState<UserSession>({
    joinedRooms: [],
    currentRoomName: undefined,
  });

  useEffect(() => {
    //TODO: fetch these informations from session
    setUserSession(mockUserSession);
  }, []);

  //TODO: create unmounting useEffect to save session changes and set current room to the last visited room

  const handleCreateRoom = () => {
    setCurrentView("create-room");
  };

  const handleJoinRoom = () => {
    setCurrentView("join-room");
  };

  const handleRoomSelect = (roomName: string) => {
    console.log(`Selected room: ${roomName}`);

    // Update last visited time for the selected room
    setUserSession((prev) => ({
      ...prev,
      currentRoomName: roomName,
      joinedRooms: prev.joinedRooms.map((room) =>
        room.name === roomName
          ? { ...room, lastVisited: new Date().toISOString() }
          : room,
      ),
    }));

    setCurrentView("game");
  };

  const handleCreateRoomSubmit = (formData: CreateRoomFormData) => {
    console.log("Creating room:", formData);

    const newRoom: Room = {
      name: formData.name,
      secretKey: formData.secretKey,
      description: formData.description,
      player1Name: formData.player1Name,
      player2Name: formData.player2Name,
      batons: {
        player1: [],
        player2: [],
      },
      createdAt: new Date().toISOString(),
    };

    setUserSession((prev) => ({
      ...prev,
      currentRoomName: newRoom.name,
      joinedRooms: [
        ...prev.joinedRooms,
        {
          name: newRoom.name,
          description: newRoom.description,
          lastVisited: new Date().toISOString(),
          joinedAt: new Date().toISOString(),
        },
      ],
    }));

    setCurrentView("game");
  };

  const handleJoinRoomSubmit = (formData: JoinRoomFormData) => {
    console.log("Joining room:", formData);

    setUserSession((prev) => {
      const existingRoom = prev.joinedRooms.find(
        (room) => room.name === formData.name,
      );

      if (existingRoom) {
        return {
          ...prev,
          currentRoomName: formData.name,
          joinedRooms: prev.joinedRooms.map((room) =>
            room.name === formData.name
              ? { ...room, lastVisited: new Date().toISOString() }
              : room,
          ),
        };
      } else {
        return {
          ...prev,
          currentRoomName: formData.name,
          joinedRooms: [
            ...prev.joinedRooms,
            {
              name: formData.name,
              description: undefined,
              lastVisited: new Date().toISOString(),
              joinedAt: new Date().toISOString(),
            },
          ],
        };
      }
    });

    setCurrentView("game");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "home":
        return (
          <HomePage
            userSession={userSession}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onRoomSelect={handleRoomSelect}
          />
        );

      case "create-room":
        return (
          <CreateRoomForm
            onSubmit={handleCreateRoomSubmit}
            onCancel={handleBackToHome}
          />
        );

      case "join-room":
        return (
          <JoinRoomForm
            onSubmit={handleJoinRoomSubmit}
            onCancel={handleBackToHome}
          />
        );

      case "game":
        return (
          <div className="min-h-screen bg-gray-100">
            <div className="bg-white shadow-sm border-b px-4 py-2 flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-800">
                {userSession.currentRoomName}
              </h1>
              <button
                onClick={handleBackToHome}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Retour
              </button>
            </div>
            <DualStickCounter
              player1Name="Joueur 1" // TODO: Get from room data
              player2Name="Joueur 2" // TODO: Get from room data
              player1Sticks={[]} // TODO: Get from room data
              player2Sticks={[]} // TODO: Get from room data
            />
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="App">{renderCurrentView()}</div>;
}

export default App;
