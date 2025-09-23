import { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

/**
 * Converts Firestore Timestamp to ISO string
 */
export const timestampToString = (timestamp: Timestamp | string): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/**
 * Converts a Firestore document to a typed object with timestamp conversion
 */
export const convertFirestoreDoc = <T>(
  doc: QueryDocumentSnapshot,
  timestampFields: string[] = ["createdAt", "updatedAt"]
): T => {
  const data = doc.data();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const converted: any = { ...data, id: doc.id };

  // Convert timestamp fields
  timestampFields.forEach((field) => {
    if (converted[field]) {
      converted[field] = timestampToString(converted[field]);
    }
  });

  return converted as T;
};

/**
 * Creates a timestamp object for Firestore operations
 */
export const createTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Common Firestore collections
 */
export const COLLECTIONS = {
  USERS: "users",
  ROOMS: "rooms",
  USER_ROOM_STICKS: "userRoomSticks",
  ROOM_INVITATIONS: "room_invitations",
} as const;
