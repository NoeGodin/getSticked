import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { AuthUser } from "../types/auth.types";
import { COLLECTIONS, createTimestamp } from "../utils/firestore";
import { withErrorHandler } from "../utils/service";

export class UserService {
  static async getUserById(uid: string): Promise<AuthUser | null> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as AuthUser;
      }
      return null;
    }, "Error getting user");
  }

  static async addRoomToUser(uid: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          uid,
          joinedRooms: [roomId],
          createdAt: createTimestamp(),
          updatedAt: createTimestamp(),
        });
      } else {
        // Update existing user
        await updateDoc(userRef, {
          joinedRooms: arrayUnion(roomId),
          updatedAt: createTimestamp(),
        });
      }
    }, "Error adding room to user");
  }

  static async removeRoomFromUser(uid: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        joinedRooms: arrayRemove(roomId),
        updatedAt: createTimestamp(),
      });
    }, "Error removing room from user");
  }

  static async updateUserProfile(uid: string, updates: Partial<AuthUser>): Promise<void> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: createTimestamp(),
      });
    }, "Error updating user profile");
  }
}
