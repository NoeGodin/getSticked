import type { CreateRoomForm, JoinRoomForm, Room } from "../types/room.types";

export const mockRooms: Room[] = [
  {
    name: "Équipe Dev Frontend",
    secretKey: "secret123",
    description: "Suivi des objectifs de l'équipe frontend",
    player1Name: "Alice",
    player2Name: "Bob",
    batons: {
      player1: [
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
      player2: [
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
    },
    createdAt: "2024-01-10T08:00:00.000Z",
    updatedAt: "2024-01-15T16:10:00.000Z",
  },
  {
    name: "Projet Personnel",
    secretKey: "myproject2024",
    description: "Développement de mon app mobile",
    player1Name: "Charlie",
    player2Name: "Diana",
    batons: {
      player1: [
        {
          createdAt: "2024-01-12T15:00:00.000Z",
          comment: "Mockup validé",
          count: 800,
        },
      ],
      player2: [
        {
          createdAt: "2024-01-14T10:30:00.000Z",
          comment: "Base de données configurée",
          count: 6,
        },
        {
          createdAt: "2024-01-14T18:45:00.000Z",
          comment: "Première version déployée",
          count: 8,
        },
      ],
    },
    createdAt: "2024-01-12T14:22:00.000Z",
    updatedAt: "2024-01-14T18:45:00.000Z",
  },
  {
    name: "Formation TypeScript",
    secretKey: "learn_ts_2024",
    description: "Apprentissage en binôme TypeScript",
    player1Name: "Emma",
    player2Name: "Felix",
    batons: {
      player1: [
        {
          createdAt: "2024-01-14T12:00:00.000Z",
          comment: "Chapitre interfaces terminé",
          count: 3,
        },
      ],
      player2: [
        {
          createdAt: "2024-01-15T09:30:00.000Z",
          comment: "Exercices génériques réussis",
          count: 4,
        },
      ],
    },
    createdAt: "2024-01-14T11:30:00.000Z",
    updatedAt: "2024-01-15T09:30:00.000Z",
  },
];

export const emptyRoom: Room = {
  name: "",
  secretKey: "",
  description: "",
  player1Name: "",
  player2Name: "",
  batons: {
    player1: [],
    player2: [],
  },
  createdAt: new Date().toISOString(),
};

export const mockCreateRoomForm: CreateRoomForm = {
  name: "Nouveau Salon",
  secretKey: "monsecret123",
  description: "Description de test",
  player1Name: "Joueur 1",
  player2Name: "Joueur 2",
};

export const mockJoinRoomForm: JoinRoomForm = {
  name: "Équipe Dev Frontend",
  secretKey: "secret123",
};
