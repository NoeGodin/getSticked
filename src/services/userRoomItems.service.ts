// noinspection GrazieInspection

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
    item: Omit<UserItem, "id">,
    performedBy?: string
  ): Promise<void> {
    return withErrorHandler(async () => {
      // Check if performed by owner when modifying another user's items
      if (performedBy && performedBy !== userId) {
        const { RoomService } = await import("./room.service");
        const room = await RoomService.getRoomByIdLight(roomId);
        if (!room || room.owner.uid !== performedBy) {
          throw new Error("Only room owner can modify other users' items");
        }
      }

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
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };

      const updatedItems = [...userRoomItems.items, newItem];

      await updateDoc(doc(db, COLLECTIONS.USER_ROOM_ITEMS, userRoomItems.id!), {
        items: updatedItems,
        updatedAt: createTimestamp(),
      });
    }, "Error adding item");
  }

  /**
   * Set user's score to a specific value (owner only)
   */
  static async setUserScore(
    targetUserId: string,
    roomId: string,
    optionId: string,
    newScore: number,
    performedBy: string
  ): Promise<void> {
    return withErrorHandler(async () => {
      // Verify performer is room owner
      const { RoomService } = await import("./room.service");
      const room = await RoomService.getRoomByIdLight(roomId);
      if (!room || room.owner.uid !== performedBy) {
        throw new Error("Only room owner can set user scores");
      }

      const userRoomItems = await this.getUserRoomItems(targetUserId, roomId);
      if (!userRoomItems) {
        throw new Error("User not found in room");
      }

      // Calculate current score for this option
      const currentScore = userRoomItems.items
        .filter((item) => item.optionId === optionId && !item.isRemoved)
        .reduce((sum, item) => sum + (item.count || 1), 0);

      const difference = newScore - currentScore;

      if (difference !== 0) {
        // Create adjustment item
        const adjustmentItem: UserItem = {
          id: `adjustment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          optionId: optionId,
          count: difference,
          comment: `Score adjusted by owner to ${newScore}`,
          createdAt: createTimestamp(),
        };

        const updatedItems = [...userRoomItems.items, adjustmentItem];

        await updateDoc(
          doc(db, COLLECTIONS.USER_ROOM_ITEMS, userRoomItems.id!),
          {
            items: updatedItems,
            updatedAt: createTimestamp(),
          }
        );
      }
    }, "Error setting user score");
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
