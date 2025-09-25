import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  COLLECTIONS,
  convertFirestoreDoc,
  createTimestamp,
} from "../utils/firestore";
import { withErrorHandler } from "../utils/service";
import type { UserItem, UserRoomItems } from "../types/item-type.types";

export class UserRoomItemsService {
  /**
   * Get user items for a specific room
   */
  static async getUserRoomItems(
    userId: string,
    roomId: string
  ): Promise<UserRoomItems | null> {
    return withErrorHandler(async () => {
      const itemsRef = collection(db, COLLECTIONS.USER_ROOM_ITEMS);
      const q = query(
        itemsRef,
        where("userId", "==", userId),
        where("roomId", "==", roomId)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return convertFirestoreDoc<UserRoomItems>(snapshot.docs[0]);
      }

      return null;
    }, "Error fetching user room items");
  }

  /**
   * Join a room (create user room items entry)
   */
  static async joinRoom(userId: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      // Check if already exists
      const existing = await this.getUserRoomItems(userId, roomId);
      if (existing) {
        return; // Already joined
      }

      const newUserRoomItems: Omit<UserRoomItems, "id"> = {
        userId,
        roomId,
        items: [],
        createdAt: createTimestamp(),
      };

      await addDoc(
        collection(db, COLLECTIONS.USER_ROOM_ITEMS),
        newUserRoomItems
      );
    }, "Error joining room");
  }

  /**
   * Leave a room (delete user room items entry)
   */
  static async leaveRoom(userId: string, roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const userRoomItems = await this.getUserRoomItems(userId, roomId);
      if (!userRoomItems || !userRoomItems.id) {
        return; // Not in room
      }

      await deleteDoc(doc(db, COLLECTIONS.USER_ROOM_ITEMS, userRoomItems.id));
    }, "Error leaving room");
  }

  /**
   * Add an item to user's collection in a room
   */
  static async addItem(
    userId: string,
    roomId: string,
    item: Omit<UserItem, "id">
  ): Promise<void> {
    return withErrorHandler(async () => {
      let userRoomItems = await this.getUserRoomItems(userId, roomId);

      if (!userRoomItems) {
        // Create new entry if doesn't exist
        await this.joinRoom(userId, roomId);
        userRoomItems = await this.getUserRoomItems(userId, roomId);
        if (!userRoomItems) {
          throw new Error("Failed to create user room items entry");
        }
      }

      const newItem: UserItem = {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedItems = [...userRoomItems.items, newItem];

      await updateDoc(doc(db, COLLECTIONS.USER_ROOM_ITEMS, userRoomItems.id!), {
        items: updatedItems,
        updatedAt: createTimestamp(),
      });
    }, "Error adding item");
  }

  /**
   * Get all users' items for a room
   */
  static async getAllRoomItems(roomId: string): Promise<UserRoomItems[]> {
    return withErrorHandler(async () => {
      const itemsRef = collection(db, COLLECTIONS.USER_ROOM_ITEMS);
      const q = query(
        itemsRef,
        where("roomId", "==", roomId),
        orderBy("createdAt", "asc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        convertFirestoreDoc<UserRoomItems>(doc)
      );
    }, "Error fetching room items");
  }

  /**
   * Delete all items for a room (when room is deleted)
   */
  static async deleteAllRoomItems(roomId: string): Promise<void> {
    return withErrorHandler(async () => {
      const allItems = await this.getAllRoomItems(roomId);

      for (const userRoomItems of allItems) {
        if (userRoomItems.id) {
          await deleteDoc(
            doc(db, COLLECTIONS.USER_ROOM_ITEMS, userRoomItems.id)
          );
        }
      }
    }, "Error deleting room items");
  }
}
