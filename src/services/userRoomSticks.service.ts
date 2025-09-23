import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { UserRoomSticks } from "../types/room.types";
import type { Stick } from "../types/stick.types";
import type { AuthUser } from "../types/auth.types";
import {
  COLLECTIONS,
  convertFirestoreDoc,
  createTimestamp,
} from "../utils/firestore";
import { AuthUtils, withErrorHandler } from "../utils/service";

const convertFirestoreToUserRoomSticks = (
  doc: QueryDocumentSnapshot
): UserRoomSticks => {
  return convertFirestoreDoc<UserRoomSticks>(doc);
};

export class UserRoomSticksService {
  /**
   * Gets the stick counter for a user in a specific room
   */
  static async getUserRoomSticks(
    userId: string,
    roomId: string
  ): Promise<UserRoomSticks | null> {
    return withErrorHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.USER_ROOM_STICKS),
        where("userId", "==", userId),
        where("roomId", "==", roomId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Only one document by user / room
      const doc = querySnapshot.docs[0];
      return convertFirestoreToUserRoomSticks(doc);
    }, "Error retrieving sticks");
  }

  /**
   * Gets all counters for a room (all users)
   */
  static async getRoomSticks(roomId: string): Promise<UserRoomSticks[]> {
    return withErrorHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.USER_ROOM_STICKS),
        where("roomId", "==", roomId)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) =>
        convertFirestoreToUserRoomSticks(doc)
      );
    }, "Error retrieving room sticks");
  }
  /**
   * Creates or updates a user's stick counter for a room
   */
  static async updateUserSticks(
    userId: string,
    roomId: string,
    sticks: Stick[],
    performedBy: AuthUser
  ): Promise<void> {
    return withErrorHandler(async () => {
      // ULTIMATE PROTECTION: A user can only update their own sticks
      AuthUtils.ensureOwnership(userId, performedBy);

      // Check if the counter already exists
      const existingSticks = await this.getUserRoomSticks(userId, roomId);

      if (existingSticks && existingSticks.id) {
        // Update existing document
        const docRef = doc(db, COLLECTIONS.USER_ROOM_STICKS, existingSticks.id);
        await updateDoc(docRef, {
          sticks,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new document
        const newUserRoomSticks: Omit<UserRoomSticks, "id" | "updatedAt"> = {
          userId,
          roomId,
          sticks,
          createdAt: createTimestamp(),
        };

        await addDoc(
          collection(db, COLLECTIONS.USER_ROOM_STICKS),
          newUserRoomSticks
        );
      }
    }, "Error updating sticks");
  }

  /**
   * Adds a stick to a user's counter
   */
  static async addStick(
    userId: string,
    roomId: string,
    stick: Stick,
    performedBy: AuthUser
  ): Promise<void> {
    return withErrorHandler(async () => {
      // PROTECTION: A user can only add sticks for themselves
      AuthUtils.ensureOwnership(userId, performedBy);

      const existingSticks = await this.getUserRoomSticks(userId, roomId);
      let newSticks: Stick[];

      if (existingSticks) {
        newSticks = [...existingSticks.sticks, stick];
      } else {
        newSticks = [stick];
      }

      await this.updateUserSticks(userId, roomId, newSticks, performedBy);
    }, "Error adding stick");
  }
  /**
   * Makes a user join a room (creates empty counter)
   */
  static async joinRoom(
    userId: string,
    roomId: string,
    performedBy: AuthUser
  ): Promise<void> {
    return withErrorHandler(async () => {
      // Check if user has already joined this room
      const existingSticks = await this.getUserRoomSticks(userId, roomId);

      if (existingSticks) {
        console.log("User has already joined this room");
        return;
      }

      // Create empty counter to mark that user has joined the room
      await this.updateUserSticks(userId, roomId, [], performedBy);
    }, "Error joining room");
  }

  /**
   * Quit a user and delete his sticks
   */
  static async leaveRoom(userId: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const existingSticks = await this.getUserRoomSticks(userId, roomId);

      if (!existingSticks || !existingSticks.id) {
        throw new Error("User is not in this room");
      }

      await deleteDoc(doc(db, COLLECTIONS.USER_ROOM_STICKS, existingSticks.id));
    }, "Error leaving room");
  }

  /**
   * Deletes all counters for a room (when room is deleted)
   */
  static async deleteAllRoomSticks(roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const roomSticks = await this.getRoomSticks(roomId);

      const batch = writeBatch(db);

      roomSticks.forEach((userSticks) => {
        if (userSticks.id) {
          batch.delete(doc(db, COLLECTIONS.USER_ROOM_STICKS, userSticks.id));
        }
      });

      await batch.commit();
    }, "Error deleting room sticks");
  }

  /**
   * Calculates total number of active sticks for a user in a room
   */
  static getTotalActiveSticks(userRoomSticks: UserRoomSticks): number {
    if (!userRoomSticks.sticks) return 0;

    return userRoomSticks.sticks
      .filter((stick) => !stick.isRemoved)
      .reduce((total, stick) => total + stick.count, 0);
  }

  /**
   * Gets room statistics
   */
  static async getRoomStats(roomId: string): Promise<{
    totalUsers: number;
    totalSticks: number;
    mostActiveUser?: string;
  }> {
    return withErrorHandler(async () => {
      const roomSticks = await this.getRoomSticks(roomId);

      let totalSticks = 0;
      let mostActiveUser = "";
      let maxSticks = 0;

      roomSticks.forEach((userSticks) => {
        const userTotal = this.getTotalActiveSticks(userSticks);
        totalSticks += userTotal;

        if (userTotal > maxSticks) {
          maxSticks = userTotal;
          mostActiveUser = userSticks.userId;
        }
      });

      return {
        totalUsers: roomSticks.length,
        totalSticks,
        mostActiveUser: mostActiveUser || undefined,
      };
    }, "Error calculating statistics");
  }
}
