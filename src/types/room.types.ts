import type { Stick } from "./stick.types.ts";

export interface UserRoomSticks {
  id?: string; // Firebase document ID
  userId: string; // ID of authenticated user
  roomId: string; // ID of room
  sticks: Stick[];
  createdAt: string; // ISO string when joining room
  updatedAt?: string; // ISO string
}

export interface ActionHistory {
  id: string;
  type:
    | "stick_added"
    | "stick_removed"
    | "user_joined"
    | "user_left"
    | "room_updated";
  userId?: string; // ID of the concerned user (replaces playerId)
  stickType?: string;
  performedBy: {
    uid: string;
    displayName: string;
  };
  timestamp: string;
  details?: string;
}

// Interface for a room (now without predefined players)
export interface Room {
  id?: string; // Firebase document ID
  name: string;
  description?: string;
  owner: {
    uid: string;
    displayName: string;
  };
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  history: ActionHistory[];
  memberIds: string[]; // List of user IDs who have sticks in this room
}

// Interface for creating a room (simplified)
export interface CreateRoomForm {
  name: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  sticks: Stick[];
}
