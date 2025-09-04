import type { Stick } from "./stick.types.ts";

export interface Room {
  id?: string; // Firebase document ID
  name: string;
  secretKey: string;
  description?: string;
  player1Name: string;
  player2Name: string;
  batons: {
    player1: Stick[];
    player2: Stick[];
  };
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
