import type { Stick } from "./stick.types";
import type { UserSession } from "./session.types.ts";
import React from "react";

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
  setUserSession: React.Dispatch<React.SetStateAction<UserSession>>;
}
