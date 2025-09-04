import type { Stick } from "./stick.types";
import type { UserSession } from "./session.types.ts";

export interface StickCounterProps {
  playerName: string;
  sticks: Stick[];
  roomId?: string;
  player: "player1" | "player2";
  onSticksUpdate?: (newSticks: Stick[]) => void;
}

export interface StickLogProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  sticks: Stick[];
}

export interface HomePageProps {
  userSession: UserSession;
  setUserSession: (session: UserSession) => void;
}
