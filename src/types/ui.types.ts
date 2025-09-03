import type { Stick } from "./stick.types";

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
