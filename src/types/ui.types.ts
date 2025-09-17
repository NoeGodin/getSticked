import type { Stick } from "./stick.types";

export interface StickCounterProps {
  playerName: string;
  sticks: Stick[];
  roomId?: string;
  player: string;
  onSticksUpdate?: (newSticks: Stick[]) => void;
}

export interface StickLogProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  sticks: Stick[];
}
