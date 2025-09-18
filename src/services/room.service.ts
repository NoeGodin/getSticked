import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  ActionHistory,
  CreateRoomForm,
  Player,
  Room,
} from "../types/room.types";
import type { Stick } from "../types/stick.types";
import type { AuthUser } from "../types/auth.types";

const ROOMS_COLLECTION = "rooms";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertFirestoreToRoom = (doc: any, includeHistory: boolean = true): Room => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt,
    history: includeHistory ? (Array.isArray(data.history) ? data.history : []) : [],
  } as Room;
};

export class RoomService {
  // Public method to convert Firestore docs to Room objects
  static convertDocToRoom(doc: any, includeHistory: boolean = false): Room {
    return convertFirestoreToRoom(doc, includeHistory);
  }

  static async createRoom(
    roomData: CreateRoomForm,
    owner: AuthUser,
  ): Promise<string> {
    try {
      const players: Player[] = roomData.playerNames.map((name, index) => ({
        id: `player${index + 1}`,
        name: name.trim(),
        sticks: [],
      }));

      const newRoom: Omit<Room, "updatedAt"> = {
        name: roomData.name,
        description: roomData.description,
        players,
        owner: {
          uid: owner.uid,
          displayName: owner.displayName,
        },
        createdAt: new Date().toISOString(),
        history: [
          {
            id: `action_${Date.now()}`,
            type: "room_updated",
            performedBy: {
              uid: owner.uid,
              displayName: owner.displayName,
            },
            timestamp: new Date().toISOString(),
            details: "Room created",
          },
        ],
      };

      const docRef = await addDoc(collection(db, ROOMS_COLLECTION), newRoom);
      return docRef.id;
    } catch (error) {
      throw new Error(`Erreur lors de la création de la room: ${error}`);
    }
  }


  static async getRoomById(roomId: string, includeHistory: boolean = true): Promise<Room | null> {
    try {
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return convertFirestoreToRoom(docSnap, includeHistory);
      }
      return null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la room: ${error}`);
    }
  }

  // Optimized method for listing rooms without history (for HomePage)
  static async getRoomByIdLight(roomId: string): Promise<Room | null> {
    return this.getRoomById(roomId, false);
  }

  static async updatePlayerSticks(
    roomId: string,
    playerId: string,
    sticks: Stick[],
    performedBy: AuthUser,
    actionHistory?: {
      type: 'stick_added' | 'stick_removed';
      count: number;
      details: string;
    },
  ): Promise<void> {
    try {
      // Get the current room
      const room = await RoomService.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const player = room.players.find((p) => p.id === playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      // Update the specific player's sticks
      const updatedPlayers = room.players.map((player) =>
        player.id === playerId ? { ...player, sticks } : player,
      );

      // Add action to history if provided
      let updatedHistory = room.history;
      if (actionHistory) {
        const newAction: ActionHistory = {
          id: `action_${Date.now()}`,
          type: actionHistory.type,
          playerId,
          playerName: player.name,
          performedBy: {
            uid: performedBy.uid,
            displayName: performedBy.displayName,
          },
          timestamp: new Date().toISOString(),
          details: actionHistory.details,
        };

        updatedHistory = [...room.history, newAction];
      }

      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        players: updatedPlayers,
        history: updatedHistory,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des bâtons: ${error}`);
    }
  }

  static async updateRoomDetails(updatedRoom: Room): Promise<void> {
    try {
      if (!updatedRoom.id) {
        throw new Error("Room ID is required for update");
      }

      const docRef = doc(db, ROOMS_COLLECTION, updatedRoom.id);

      // Prepare update data, excluding the id field
      await updateDoc(docRef, {
        name: updatedRoom.name,
        description: updatedRoom.description,
        players: updatedRoom.players,
        createdAt: updatedRoom.createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la mise à jour des détails de la room: ${error}`,
      );
    }
  }

  static async deleteRoom(
    roomId: string,
    performedBy: AuthUser,
  ): Promise<void> {
    try {
      // First verify the room exists and user is owner
      const room = await RoomService.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Check if user is the owner
      if (room.owner.uid !== performedBy.uid) {
        throw new Error("Only room owner can delete the room");
      }

      await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de la room: ${error}`);
    }
  }
}
