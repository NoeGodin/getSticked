import type { JoinedRoom, UserSession } from "../types/session.types";

export const mockJoinedRooms: JoinedRoom[] = [
  {
    name: "Équipe Dev Frontend",
    joinedAt: "2024-01-10T08:00:00.000Z",
    lastVisited: "2024-01-15T17:30:00.000Z",
  },
  {
    name: "Projet Personnel",
    joinedAt: "2024-01-12T14:22:00.000Z",
    lastVisited: "2024-01-14T20:15:00.000Z",
  },
  {
    name: "Formation TypeScript",
    joinedAt: "2024-01-14T11:30:00.000Z",
    lastVisited: "2024-01-15T16:45:00.000Z",
  },
];

export const mockUserSession: UserSession = {
  joinedRooms: mockJoinedRooms,
  currentRoomName: "Équipe Dev Frontend",
};

export const emptyUserSession: UserSession = {
  joinedRooms: [],
  currentRoomName: undefined,
};
