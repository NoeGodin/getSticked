import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import JoinRoomForm from "./pages/JoinRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";
import type { UserSession } from "./types/session.types";
import { mockUserSession } from "./data/session.data.ts";

function App() {
  const [userSession, setUserSession] = useState<UserSession>({
    joinedRooms: [],
    currentRoomName: undefined,
  });

  useEffect(() => {
    //TODO: fetch from storage/session API
    //the data we fetch should contain secret keys and should be entirely crypted none of its content should be readable
    setUserSession(mockUserSession);
  }, []);

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
              setUserSession={setUserSession}
            />
          }
        />

        {/* Create Room */}
        <Route
          path="/create"
          element={<CreateRoomForm setUserSession={setUserSession} />}
        />

        {/* Join Room */}
        <Route
          path="/join"
          element={<JoinRoomForm setUserSession={setUserSession} />}
        />

        {/* Game */}
        <Route
          path="/game"
          element={
            <DualStickCounter
              userSession={userSession}
              getCurrentRoom={getCurrentRoom}
              player1Sticks={[]} // TODO: from room data
              player2Sticks={[]} // TODO: from room data
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
