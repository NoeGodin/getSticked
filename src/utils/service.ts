import type { AuthUser } from "../types/auth.types";

/**
 * Wraps async operations with error handling
 */
export const withErrorHandler = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw new Error(`${errorMessage}: ${error}`);
  }
};

/**
 * Authorization utilities
 */
export class AuthUtils {
  /**
   * Ensures user can only modify their own data
   */
  static ensureOwnership(userId: string, performedBy: AuthUser): void {
    if (performedBy.uid !== userId) {
      throw new Error(
        "Accès interdit : vous ne pouvez modifier que vos propres données"
      );
    }
  }

  /**
   * Checks if user is room owner
   */
  static isRoomOwner(roomOwnerUid: string, userId: string): boolean {
    return roomOwnerUid === userId;
  }

  /**
   * Checks if user is room member
   */
  static isRoomMember(
    userRooms: string[] | undefined,
    roomId: string
  ): boolean {
    return userRooms?.includes(roomId) || false;
  }

  /**
   * Ensures user has access to room (is owner or member)
   */
  static ensureRoomAccess(
    roomOwnerUid: string,
    userRooms: string[] | undefined,
    roomId: string,
    userId: string,
    operation: string = "this operation"
  ): void {
    const isOwner = this.isRoomOwner(roomOwnerUid, userId);
    const isMember = this.isRoomMember(userRooms, roomId);

    if (!isOwner && !isMember) {
      throw new Error(`Only room members can perform ${operation}`);
    }
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validates required fields
   */
  static validateRequired(value: unknown, fieldName: string): void {
    if (!value) {
      throw new Error(`${fieldName} is required`);
    }
  }
  /**
   * Validates email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
  }
}
