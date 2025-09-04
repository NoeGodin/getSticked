import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import JoinRoomForm from "./pages/JoinRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";
import type { UserSession } from "./types/session.types";

function App() {
  const [userSession, setUserSession] = useState<UserSession>({
    joinedRooms: [],
    currentRoomName: undefined,
  });

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

    loadUserSession();
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
