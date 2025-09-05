import type { Stick } from "./stick.types.ts";

export interface Player {
  id: string;
  name: string;
  sticks: Stick[];
}

export interface Room {
  id?: string; // Firebase document ID
  name: string;
  secretKey: string;
  description?: string;
  players: Player[];
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface CreateRoomForm {
  name: string;
  secretKey: string;
  description: string;
  player1Name: string;
  player2Name: string;
}

export interface JoinRoomForm {
  name: string;
  secretKey: string;
}
