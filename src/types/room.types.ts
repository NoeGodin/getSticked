import type { Stick } from "./stick.types.ts";

export interface Player {
  id: string;
  name: string;
  sticks: Stick[];
}

export interface ActionHistory {
  id: string;
  type: 'stick_added' | 'stick_removed' | 'player_added' | 'player_removed' | 'room_updated';
  playerId?: string;
  playerName?: string;
  stickType?: string;
  performedBy: {
    uid: string;
    displayName: string;
  };
  timestamp: string;
  details?: string;
}

export interface Room {
  id?: string; // Firebase document ID
  name: string;
  secretKey: string;
  description?: string;
  players: Player[];
  owner: {
    uid: string;
    displayName: string;
  };
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  history: ActionHistory[];
}

export interface CreateRoomForm {
  name: string;
  secretKey: string;
  description: string;
  playerNames: string[];
}

export interface JoinRoomForm {
  name: string;
  secretKey: string;
}
