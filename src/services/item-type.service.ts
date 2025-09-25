// noinspection SpellCheckingInspection

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  COLLECTIONS,
  convertFirestoreDoc,
  createTimestamp,
} from "../utils/firestore";
import { withErrorHandler } from "../utils/service";
import type { ItemType } from "../types/item-type.types";

export class ItemTypeService {
  /**
   * get all types (generic & user custom)
   */
  static async getAvailableTypes(userId?: string): Promise<ItemType[]> {
    return withErrorHandler(async () => {
      const typesRef = collection(db, COLLECTIONS.ITEM_TYPES);

      const queries = [
        query(
          typesRef,
          where("isGeneric", "==", true),
          orderBy("createdAt", "asc")
        ),
      ];

      if (userId) {
        queries.push(
          query(
            typesRef,
            where("createdBy", "==", userId),
            orderBy("createdAt", "desc")
          )
        );
      }

      const results = await Promise.all(queries.map((q) => getDocs(q)));

      const allTypes: ItemType[] = [];
      results.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          allTypes.push(convertFirestoreDoc<ItemType>(doc));
        });
      });

      return allTypes;
    }, "Error fetching available types");
  }

  static async getTypeById(typeId: string): Promise<ItemType | null> {
    return withErrorHandler(async () => {
      const typeRef = doc(db, COLLECTIONS.ITEM_TYPES, typeId);
      const typeDoc = await getDoc(typeRef);

      if (typeDoc.exists()) {
        return convertFirestoreDoc<ItemType>(typeDoc);
      }
      return null;
    }, "Error fetching type by ID");
  }

  static async createCustomType(
    typeData: Omit<ItemType, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<string> {
    return withErrorHandler(async () => {
      const newType: Omit<ItemType, "id"> = {
        ...typeData,
        createdBy: userId,
        isGeneric: false,
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
      };

      // Add unique id to otions
      const typeWithOptionIds: Omit<ItemType, "id"> = {
        ...newType,
        options: newType.options.map((option) => ({
          ...option,
          id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })),
      };

      const typesRef = collection(db, COLLECTIONS.ITEM_TYPES);
      const docRef = await addDoc(typesRef, typeWithOptionIds);

      return docRef.id;
    }, "Error creating custom type");
  }
}
