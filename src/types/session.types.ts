export interface UserSession {
  joinedRooms: JoinedRoom[];
  currentRoomName?: string;
}

export interface JoinedRoom {
  name: string;
  joinedAt: string; // ISO string
  lastVisited?: string; // ISO string
}
