import type { Stick } from "./stick.types";
import type { UserSession } from "./session.types.ts";

export interface StickCounterProps {
  playerName: string;
  sticks: Stick[];
}

export interface StickLogProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  sticks: Stick[];
}

export interface HomePageProps {
  userSession: UserSession;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onRoomSelect: (roomName: string) => void;
}
