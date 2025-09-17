import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../config/firebase";
import type { AuthUser } from "../types/auth.types";

const USERS_COLLECTION = "users";

export class UserService {

  static async getUserById(uid: string): Promise<AuthUser | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as AuthUser;
      }
      return null;
    } catch (error) {
      throw new Error(`Error getting user: ${error}`);
    }
  }

  static async addRoomToUser(uid: string, roomId: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          uid,
          joinedRooms: [roomId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Update existing user
        await updateDoc(userRef, {
          joinedRooms: arrayUnion(roomId),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      throw new Error(`Error adding room to user: ${error}`);
    }
  }

  static async removeRoomFromUser(uid: string, roomId: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        joinedRooms: arrayRemove(roomId),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(`Error removing room from user: ${error}`);
    }
  }

}