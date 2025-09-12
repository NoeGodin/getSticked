import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import JoinRoomForm from "./pages/JoinRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";
import type { UserSession } from "./types/session.types";
import { RoomService } from "./services/room.service";
import { extractRoomIdFromUrl, clearRoomIdFromUrl } from "./utils/invitation";
import { sessionManager } from "./services/session.service";

function App() {
  const [userSession, setUserSession] = useState<UserSession>({
    joinedRooms: [],
    currentRoomName: undefined,
  });
  const [isProcessingInvitation, setIsProcessingInvitation] = useState<boolean>(false);

  useEffect(() => {
    const loadUserSession = () => {
      try {
        const loadedSession = sessionManager.loadSession();
        setUserSession(loadedSession);
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
            // Add room to session using SessionManager
            const newJoinedRoom = {
              name: room.name,
              secretKey: room.secretKey,
              joinedAt: new Date().toISOString(),
              lastVisited: new Date().toISOString(),
            };
            
            // Add room (will handle duplicates automatically)
            sessionManager.addRoom(newJoinedRoom);
            
            // Set as current room
            sessionManager.setCurrentRoom(room.name);
            
            // Update local state
            const updatedSession = sessionManager.getCurrentSession();
            setUserSession(updatedSession);
            
            // Clear the roomId from URL
            clearRoomIdFromUrl();
            
            // Navigate to game using room ID
            window.location.hash = `/room/${roomId}`;
            
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
      const success = sessionManager.saveSession(session);
      if (success) {
        setUserSession(session);
      } else {
        console.error('Failed to save user session');
      }
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  };

  const getCurrentRoom = () => sessionManager.getCurrentRoom();

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

        {/* Game - with room ID parameter */}
        <Route
          path="/room/:roomId"
          element={
            <DualStickCounter
              userSession={userSession}
              getCurrentRoom={getCurrentRoom}
            />
          }
        />

        {/* Legacy game route redirect */}
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
