import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import type {
  CreateRoomForm,
  JoinRoomForm,
  Player,
  Room,
} from "../types/room.types";
import type { Stick } from "../types/stick.types";

const ROOMS_COLLECTION = "rooms";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertFirestoreToRoom = (doc: any): Room => {
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
  } as Room;
};

export class RoomService {
  static async createRoom(roomData: CreateRoomForm): Promise<string> {
    try {
      const players: Player[] = roomData.playerNames.map((name, index) => ({
        id: `player${index + 1}`,
        name: name.trim(),
        sticks: [],
      }));

      const newRoom: Omit<Room, "updatedAt"> = {
        name: roomData.name,
        secretKey: roomData.secretKey,
        description: roomData.description,
        players,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, ROOMS_COLLECTION), newRoom);
      return docRef.id;
    } catch (error) {
      throw new Error(`Erreur lors de la création de la room: ${error}`);
    }
  }

  static async joinRoom(joinData: JoinRoomForm): Promise<Room | null> {
    try {
      const q = query(
        collection(db, ROOMS_COLLECTION),
        where("name", "==", joinData.name),
        where("secretKey", "==", joinData.secretKey),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null; // Room not found or invalid credentials
      }

      const doc = querySnapshot.docs[0];
      return convertFirestoreToRoom(doc);
    } catch (error) {
      throw new Error(`Erreur lors de la connexion à la room: ${error}`);
    }
  }

  static async getRoomById(roomId: string): Promise<Room | null> {
    try {
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return convertFirestoreToRoom(docSnap);
      }
      return null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la room: ${error}`);
    }
  }

  static async updatePlayerSticks(
    roomId: string,
    playerId: string,
    sticks: Stick[],
  ): Promise<void> {
    try {
      // Get the current room
      const room = await RoomService.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Update the specific player's sticks
      const updatedPlayers = room.players.map((player) =>
        player.id === playerId ? { ...player, sticks } : player,
      );

      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des bâtons: ${error}`);
    }
  }

  static async addPlayerToRoom(
    roomId: string,
    playerName: string,
  ): Promise<void> {
    try {
      const room = await RoomService.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const newPlayer: Player = {
        id: `player${room.players.length + 1}`,
        name: playerName,
        sticks: [],
      };

      const updatedPlayers = [...room.players, newPlayer];

      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout du joueur: ${error}`);
    }
  }

  static async updateRoom(
    roomId: string,
    updates: Partial<Room>,
  ): Promise<void> {
    try {
      const docRef = doc(db, ROOMS_COLLECTION, roomId);

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de la room: ${error}`);
    }
  }

  static async deleteRoom(roomId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de la room: ${error}`);
    }
  }

  static async getAllRooms(): Promise<Room[]> {
    try {
      const q = query(
        collection(db, ROOMS_COLLECTION),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => convertFirestoreToRoom(doc));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rooms: ${error}`);
    }
  }

  static async roomNameExists(name: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, ROOMS_COLLECTION),
        where("name", "==", name),
        limit(1),
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification du nom: ${error}`);
    }
  }

  static async cleanOldRooms(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const q = query(
        collection(db, ROOMS_COLLECTION),
        where("createdAt", "<", Timestamp.fromDate(cutoffDate)),
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );

      await Promise.all(deletePromises);
      return querySnapshot.size;
    } catch (error) {
      throw new Error(`Erreur lors du nettoyage: ${error}`);
    }
  }

  static async getRoomStats(): Promise<{
    totalRooms: number;
    roomsToday: number;
    roomsThisWeek: number;
  }> {
    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [totalQuery, todayQuery, weekQuery] = await Promise.all([
        getDocs(collection(db, ROOMS_COLLECTION)),
        getDocs(
          query(
            collection(db, ROOMS_COLLECTION),
            where("createdAt", ">=", Timestamp.fromDate(todayStart)),
          ),
        ),
        getDocs(
          query(
            collection(db, ROOMS_COLLECTION),
            where("createdAt", ">=", Timestamp.fromDate(weekStart)),
          ),
        ),
      ]);

      return {
        totalRooms: totalQuery.size,
        roomsToday: todayQuery.size,
        roomsThisWeek: weekQuery.size,
      };
    } catch (error) {
      throw new Error(`Erreur lors du calcul des statistiques: ${error}`);
    }
  }
}
