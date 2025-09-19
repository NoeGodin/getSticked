import type { Stick } from "./stick.types";

export interface StickCounterProps {
  playerName: string;
  sticks: Stick[];
  roomId?: string;
  player: string;
  onSticksUpdate?: (newSticks: Stick[]) => void;
  hideHistoryIcon?: boolean; // Hide history icon when room > 4 players in single view
}

export interface StickLogProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  sticks: Stick[];
}
