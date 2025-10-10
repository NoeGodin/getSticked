import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { AuthUser } from "../types/auth.types";
import { COLLECTIONS, createTimestamp } from "../utils/firestore";
import { withErrorHandler } from "../utils/service";
import { MemoryCache } from "../utils/cache";

export class UserService {
  static async getUserById(uid: string): Promise<AuthUser | null> {
    const cacheKey = `user_${uid}`;

    return MemoryCache.getOrFetch(
      cacheKey,
      async () => {
        return withErrorHandler(async () => {
          const userRef = doc(db, COLLECTIONS.USERS, uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            return userDoc.data() as AuthUser;
          }
          return null;
        }, "Error getting user");
      },
      5 * 60 * 1000
    ); // Cache for 5 minutes
  }

  /**
   * Get multiple users by IDs in a single query - NEW OPTIMIZED METHOD
   */
  static async getUsersByIds(
    userIds: string[]
  ): Promise<Map<string, AuthUser>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // Check cache first for all users
    const usersMap = new Map<string, AuthUser>();
    const uncachedIds: string[] = [];

    for (const uid of userIds) {
      const cached = MemoryCache.get<AuthUser>(`user_${uid}`);
      if (cached) {
        usersMap.set(uid, cached);
      } else {
        uncachedIds.push(uid);
      }
    }

    // Fetch uncached users
    if (uncachedIds.length > 0) {
      const fetchedUsers = await withErrorHandler(async () => {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(usersRef, where(documentId(), "in", uncachedIds));
        const snapshot = await getDocs(q);

        const users = new Map<string, AuthUser>();
        snapshot.docs.forEach((doc) => {
          const user = doc.data() as AuthUser;
          users.set(doc.id, user);

          // Cache individual users
          MemoryCache.set(`user_${doc.id}`, user, 5 * 60 * 1000);
        });

        return users;
      }, "Error fetching users");

      // Merge with existing map
      for (const [uid, user] of fetchedUsers.entries()) {
        usersMap.set(uid, user);
      }
    }

    return usersMap;
  }

  static async addRoomToUser(uid: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          uid,
          joinedRooms: { [roomId]: true },
          createdAt: createTimestamp(),
          updatedAt: createTimestamp(),
        });
      } else {
        // Update existing user using atomic map operation
        await updateDoc(userRef, {
          [`joinedRooms.${roomId}`]: true,
          updatedAt: createTimestamp(),
        });
      }

      // Clear user cache after update
      MemoryCache.clear(`user_${uid}`);
    }, "Error adding room to user");
  }

  static async removeRoomFromUser(uid: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        [`joinedRooms.${roomId}`]: null, // Use null to delete the field atomically
        updatedAt: createTimestamp(),
      });

      // Clear user cache after update
      MemoryCache.clear(`user_${uid}`);
    }, "Error removing room from user");
  }

  static async updateUserProfile(
    uid: string,
    updates: Partial<AuthUser>
  ): Promise<void> {
    return withErrorHandler(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      // Remove joinedRooms from updates to prevent overwriting
      // joinedRooms should only be modified through addRoomToUser/removeRoomFromUser
      const { joinedRooms, ...safeUpdates } = updates;
      
      if (joinedRooms !== undefined) {
        console.warn("updateUserProfile: Attempted to update joinedRooms directly. Use addRoomToUser/removeRoomFromUser instead.");
      }
      
      await updateDoc(userRef, {
        ...safeUpdates,
        updatedAt: createTimestamp(),
      });

      // Clear user cache after update
      MemoryCache.clear(`user_${uid}`);
    }, "Error updating user profile");
  }
}
