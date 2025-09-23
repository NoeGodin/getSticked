import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { ActionHistory, CreateRoomForm, Room } from "../types/room.types";
import type { AuthUser } from "../types/auth.types";
import { UserRoomSticksService } from "./userRoomSticks.service";

const ROOMS_COLLECTION = "rooms";

const convertFirestoreToRoom = (
  doc: QueryDocumentSnapshot,
  includeHistory: boolean = true
): Room => {
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
    history: includeHistory
      ? Array.isArray(data.history)
        ? data.history
        : []
      : [],
  } as Room;
};

export class RoomService {
  // Public method to convert Firestore docs to StickRoom objects
  static convertDocToRoom(
    doc: QueryDocumentSnapshot,
    includeHistory: boolean = false
  ): Room {
    return convertFirestoreToRoom(doc, includeHistory);
  }

  static async createRoom(
    roomData: CreateRoomForm,
    owner: AuthUser
  ): Promise<string> {
    try {
      // new model, empty room
      const newRoom: Omit<Room, "updatedAt"> = {
        name: roomData.name,
        description: roomData.description,
        owner: {
          uid: owner.uid,
          displayName: owner.displayName,
        },
        createdAt: new Date().toISOString(),
        memberIds: [],
        history: [
          {
            id: `action_${Date.now()}`,
            type: "room_updated",
            performedBy: {
              uid: owner.uid,
              displayName: owner.displayName,
            },
            timestamp: new Date().toISOString(),
            details: "StickRoom created",
          },
        ],
      };

      const docRef = await addDoc(collection(db, ROOMS_COLLECTION), newRoom);

      // Owner join automatically
      await UserRoomSticksService.joinRoom(owner.uid, docRef.id, owner);
      await this.addUserToRoom(docRef.id, owner.uid, owner);

      return docRef.id;
    } catch (error) {
      throw new Error(`Erreur lors de la création de la room: ${error}`);
    }
  }

  static async getRoomById(
    roomId: string,
    includeHistory: boolean = true
  ): Promise<Room | null> {
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

  static async addUserToRoom(
    roomId: string,
    userId: string,
    performedBy: AuthUser
  ): Promise<void> {
    try {
      const room = await this.getRoomById(roomId);
      if (!room) {
        throw new Error("StickRoom not found");
      }

      // Check if already member
      if (room.memberIds.includes(userId)) {
        return;
      }

      // Add user to list
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        memberIds: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });

      await this.addActionToHistory(roomId, {
        type: "user_joined",
        userId,
        performedBy,
        details: `${performedBy.displayName} a rejoint la room`,
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de l'ajout de l'utilisateur à la room: ${error}`
      );
    }
  }

  static async removeUserFromRoom(
    roomId: string,
    userId: string,
    performedBy: AuthUser
  ): Promise<void> {
    try {
      const room = await this.getRoomById(roomId);
      if (!room) {
        throw new Error("StickRoom not found");
      }

      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        memberIds: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });

      await UserRoomSticksService.leaveRoom(userId, roomId);

      await this.addActionToHistory(roomId, {
        type: "user_left",
        userId,
        performedBy,
        details: `${performedBy.displayName} a quitté la room`,
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la suppression de l'utilisateur de la room: ${error}`
      );
    }
  }

  static async addActionToHistory(
    roomId: string,
    action: {
      type: ActionHistory["type"];
      userId?: string;
      performedBy: AuthUser;
      details: string;
    }
  ): Promise<void> {
    try {
      const room = await this.getRoomById(roomId);
      if (!room) {
        throw new Error("StickRoom not found");
      }

      const newAction: ActionHistory = {
        id: `action_${Date.now()}`,
        type: action.type,
        userId: action.userId,
        performedBy: {
          uid: action.performedBy.uid,
          displayName: action.performedBy.displayName,
        },
        timestamp: new Date().toISOString(),
        details: action.details,
      };

      const updatedHistory = [...room.history, newAction];

      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        history: updatedHistory,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout à l'historique: ${error}`);
    }
  }

  static async updateRoomDetails(updatedRoom: Room): Promise<void> {
    try {
      if (!updatedRoom.id) {
        throw new Error("StickRoom ID is required for update");
      }

      const docRef = doc(db, ROOMS_COLLECTION, updatedRoom.id);

      // Update only these fields
      await updateDoc(docRef, {
        name: updatedRoom.name,
        description: updatedRoom.description,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la mise à jour des détails de la room: ${error}`
      );
    }
  }

  static async deleteRoom(
    roomId: string,
    performedBy: AuthUser
  ): Promise<void> {
    try {
      const room = await RoomService.getRoomById(roomId);
      if (!room) {
        throw new Error("StickRoom not found");
      }

      // user is owner
      if (room.owner.uid !== performedBy.uid) {
        throw new Error("Only room owner can delete the room");
      }

      await UserRoomSticksService.deleteAllRoomSticks(roomId);

      // Delete room
      await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de la room: ${error}`);
    }
  }
}
