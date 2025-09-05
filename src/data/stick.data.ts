import type { Stick } from "../types/stick.types";

export const mockSticks: Stick[] = [
  {
    createdAt: "2024-01-15T10:30:00.000Z",
    comment: "Bon travail sur le projet React",
    count: 3,
  },
  {
    createdAt: "2024-01-15T11:45:00.000Z",
    comment: "Aide apportée à un collègue",
    count: 2,
  },
  {
    createdAt: "2024-01-15T14:20:00.000Z",
    comment: "Présentation réussie",
    count: 5,
  },
  {
    createdAt: "2024-01-15T15:30:00.000Z",
    comment: "Erreur dans la présentation, retrait de points",
    count: 1,
    isRemoved: true,
  },
  {
    createdAt: "2024-01-15T16:10:00.000Z",
    comment: "",
    count: 1,
  },
  {
    createdAt: "2024-01-16T09:15:00.000Z",
    comment: "Documentation complétée",
    count: 2,
  },
  {
    createdAt: "2024-01-16T11:30:00.000Z",
    comment: "Points retirés pour retard",
    count: 2,
    isRemoved: true,
  },
];
