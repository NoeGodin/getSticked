import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import JoinRoomForm from "./pages/JoinRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";
import type { UserSession } from "./types/session.types";
import { RoomService } from "./services/room.service";
import { extractRoomIdFromUrl, clearRoomIdFromUrl } from "./utils/invitation";

function App() {
  const [userSession, setUserSession] = useState<UserSession>({
    joinedRooms: [],
    currentRoomName: undefined,
  });
  const [isProcessingInvitation, setIsProcessingInvitation] = useState<boolean>(false);

  useEffect(() => {
    const loadUserSession = () => {
      try {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession) as UserSession;
          setUserSession(parsedSession);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    };

    const handleInvitationLink = async () => {
      const roomId = extractRoomIdFromUrl();
      if (roomId) {
        setIsProcessingInvitation(true);
        try {
          // Get room data from Firebase using roomId
          const room = await RoomService.getRoomById(roomId);
          if (room) {
            // Check if user already has this room
            const savedSession = localStorage.getItem('userSession');
            let currentSession: UserSession = {
              joinedRooms: [],
              currentRoomName: undefined,
            };
            
            if (savedSession) {
              currentSession = JSON.parse(savedSession);
            }
            
            const existingRoom = currentSession.joinedRooms.find(
              jr => jr.name === room.name
            );
            
            if (!existingRoom) {
              // Add room to user session
              const newJoinedRoom = {
                name: room.name,
                secretKey: room.secretKey,
                joinedAt: new Date().toISOString(),
                lastVisited: new Date().toISOString(),
              };
              
              currentSession.joinedRooms.push(newJoinedRoom);
            }
            
            // Set as current room and navigate
            currentSession.currentRoomName = room.name;
            
            // Save session and navigate
            localStorage.setItem('userSession', JSON.stringify(currentSession));
            setUserSession(currentSession);
            
            // Clear the roomId from URL
            clearRoomIdFromUrl();
            
            // Navigate to game (we'll need to handle this with a flag)
            window.location.hash = '/game';
            
          } else {
            console.error('Room not found with ID:', roomId);
            clearRoomIdFromUrl();
          }
        } catch (error) {
          console.error('Error processing invitation:', error);
          clearRoomIdFromUrl();
        } finally {
          setIsProcessingInvitation(false);
        }
      }
    };

    loadUserSession();
    handleInvitationLink();
  }, []);

  const saveUserSession = (session: UserSession) => {
    try {
      localStorage.setItem('userSession', JSON.stringify(session));
      setUserSession(session);
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  };

  const getCurrentRoom = () =>
    userSession.joinedRooms.find(
      (room) => room.name === userSession.currentRoomName,
    );

  // Show loading screen while processing invitation
  if (isProcessingInvitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Traitement de l'invitation...
          </h2>
          <p className="text-gray-600">
            Vous allez être redirigé vers le salon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <HomePage
              userSession={userSession}
              setUserSession={saveUserSession}
            />
          }
        />

        {/* Create Room */}
        <Route
          path="/create"
          element={<CreateRoomForm setUserSession={saveUserSession} />}
        />

        {/* Join Room */}
        <Route
          path="/join"
          element={<JoinRoomForm setUserSession={saveUserSession} />}
        />

        {/* Game */}
        <Route
          path="/game"
          element={
            <DualStickCounter
              userSession={userSession}
              getCurrentRoom={getCurrentRoom}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
