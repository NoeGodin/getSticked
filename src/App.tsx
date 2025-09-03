import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import type { UserSession } from "./types/session.types";
import { mockUserSession } from "./data/session.data.ts";

function App() {
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
    console.log("Navigate to create room form");
    // TODO: Implement navigation to create room form
  };

  const handleJoinRoom = () => {
    console.log("Navigate to join room form");
    // TODO: Implement navigation to join room form
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
  };

  return (
    <div className="App">
      <HomePage
        userSession={userSession}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onRoomSelect={handleRoomSelect}
      />
    </div>
  );
}

export default App;
