import type { StickCounterProps, StickLogProps } from "../types/ui.types";
import { mockSticks } from "./stick.data";

export const mockStickCounterProps: StickCounterProps[] = [
  {
    playerName: "Alice",
    sticks: [
      {
        createdAt: "2024-01-15T10:30:00.000Z",
        comment: "Composant header terminé",
        count: 4,
      },
      {
        createdAt: "2024-01-15T14:20:00.000Z",
        comment: "Tests unitaires ajoutés",
        count: 3,
      },
    ],
    player: "player1",
  },
  {
    playerName: "Bob",
    sticks: [
      {
        createdAt: "2024-01-15T11:45:00.000Z",
        comment: "API intégrée",
        count: 21,
      },
      {
        createdAt: "2024-01-15T16:10:00.000Z",
        comment: "",
        count: 2,
      },
    ],
    player: "player1",
  },
];

export const mockStickLogProps: StickLogProps = {
  isOpen: true,
  onClose: () => console.log("Modal fermée"),
  playerName: "Alice",
  sticks: mockSticks,
};
