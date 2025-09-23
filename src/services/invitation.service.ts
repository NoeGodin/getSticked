import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  CreateInvitationRequest,
  InvitationLinkData,
  RoomInvitation,
} from "../types/invitation.types";
import type { AuthUser } from "../types/auth.types";
import { RoomService } from "./room.service";
import { UserService } from "./user.service";
import { COLLECTIONS, createTimestamp } from "../utils/firestore";
import { withErrorHandler, AuthUtils, ValidationUtils } from "../utils/service";

// Generate a random token for invitation
const generateInvitationToken = (): string => {
  // Fallback for environments without crypto.randomUUID
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  }

  // Fallback implementation
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export class InvitationService {
  /**
   * Create a new temporary invitation for a room
   */
  static async createInvitation(
    request: CreateInvitationRequest,
    createdBy: AuthUser
  ): Promise<InvitationLinkData> {
    ValidationUtils.validateRequired(request.roomId, "Room ID");
    ValidationUtils.validateRequired(createdBy.uid, "User ID");

    return withErrorHandler(async () => {
      // Verify user owns the room
      const room = await RoomService.getRoomById(request.roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Check if user has access to the room (is owner or member)
      const userData = await UserService.getUserById(createdBy.uid);
      AuthUtils.ensureRoomAccess(
        room.owner.uid,
        userData?.joinedRooms,
        request.roomId,
        createdBy.uid,
        "create invitations"
      );

      // Calculate expiration (default 24 hours)
      const expiresInHours = request.expiresInHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Generate unique token
      const token = generateInvitationToken();

      // Create invitation object (omit undefined fields for Firestore)
      const invitation: Partial<RoomInvitation> = {
        roomId: request.roomId,
        token,
        createdBy: {
          uid: createdBy.uid,
          displayName: createdBy.displayName,
        },
        createdAt: createTimestamp(),
        expiresAt: expiresAt.toISOString(),
        usedCount: 0,
        isActive: true,
        roomName: room.name,
      };

      // Only add maxUses if it's defined
      if (request.maxUses !== undefined) {
        invitation.maxUses = request.maxUses;
      }

      // Save to Firestore
      await addDoc(collection(db, COLLECTIONS.ROOM_INVITATIONS), invitation);

      // Generate URL
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const basePath = import.meta.env.BASE_URL || "";
      const url = `${origin}${basePath}?invite=${token}`;

      return {
        token,
        url,
        expiresAt: expiresAt.toISOString(),
        maxUses: request.maxUses,
      };
    }, "Failed to create invitation");
  }

  /**
   * Validate and use an invitation token
   */
  static async useInvitation(
    token: string,
    user: AuthUser
  ): Promise<{ roomId: string; roomName: string }> {
    ValidationUtils.validateRequired(token, "Invitation token");
    ValidationUtils.validateRequired(user.uid, "User ID");

    return withErrorHandler(async () => {
      // Find invitation by token
      const q = query(
        collection(db, COLLECTIONS.ROOM_INVITATIONS),
        where("token", "==", token),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid or expired invitation link");
      }

      const invitationDoc = querySnapshot.docs[0];
      const invitation = {
        id: invitationDoc.id,
        ...invitationDoc.data(),
      } as RoomInvitation;

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(invitation.expiresAt);
      if (now > expiresAt) {
        // Deactivate expired invitation
        await updateDoc(doc(db, COLLECTIONS.ROOM_INVITATIONS, invitation.id!), {
          isActive: false,
        });
        throw new Error("This invitation link has expired");
      }

      // Check usage limit
      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        await updateDoc(doc(db, COLLECTIONS.ROOM_INVITATIONS, invitation.id!), {
          isActive: false,
        });
        throw new Error("This invitation link has reached its usage limit");
      }

      // Check if user is already in the room
      const userData = await UserService.getUserById(user.uid);
      const isAlreadyJoined = AuthUtils.isRoomMember(
        userData?.joinedRooms,
        invitation.roomId
      );

      // Check if user is the owner
      const room = await RoomService.getRoomById(invitation.roomId);
      const isOwner = AuthUtils.isRoomOwner(room?.owner.uid || "", user.uid);

      if (!isOwner && !isAlreadyJoined) {
        // Add user to room
        await UserService.addRoomToUser(user.uid, invitation.roomId);
      }

      // Increment usage count
      await updateDoc(doc(db, COLLECTIONS.ROOM_INVITATIONS, invitation.id!), {
        usedCount: invitation.usedCount + 1,
      });

      return {
        roomId: invitation.roomId,
        roomName: invitation.roomName,
      };
    }, "Failed to use invitation");
  }

  /**
   * Get all active invitations for a room
   */
  static async getRoomInvitations(
    roomId: string,
    userId: string
  ): Promise<RoomInvitation[]> {
    ValidationUtils.validateRequired(roomId, "Room ID");
    ValidationUtils.validateRequired(userId, "User ID");

    return withErrorHandler(async () => {
      // Verify user owns the room
      const room = await RoomService.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      AuthUtils.ensureRoomOwnership(room.owner.uid, userId, "view invitations");

      const q = query(
        collection(db, COLLECTIONS.ROOM_INVITATIONS),
        where("roomId", "==", roomId),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as RoomInvitation
      );
    }, "Failed to get room invitations");
  }

  /**
   * Deactivate an invitation
   */
  static async deactivateInvitation(
    invitationId: string,
    userId: string
  ): Promise<void> {
    ValidationUtils.validateRequired(invitationId, "Invitation ID");
    ValidationUtils.validateRequired(userId, "User ID");

    return withErrorHandler(async () => {
      const invitationDoc = await getDoc(
        doc(db, COLLECTIONS.ROOM_INVITATIONS, invitationId)
      );

      if (!invitationDoc.exists()) {
        throw new Error("Invitation not found");
      }

      const invitation = invitationDoc.data() as RoomInvitation;

      // Verify user owns the room
      const room = await RoomService.getRoomById(invitation.roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      AuthUtils.ensureRoomOwnership(
        room.owner.uid,
        userId,
        "deactivate invitations"
      );

      await updateDoc(doc(db, COLLECTIONS.ROOM_INVITATIONS, invitationId), {
        isActive: false,
      });
    }, "Failed to deactivate invitation");
  }

  /**
   * Clean up expired invitations (utility function)
   */
  static async cleanupExpiredInvitations(): Promise<void> {
    return withErrorHandler(async () => {
      const now = createTimestamp();
      const q = query(
        collection(db, COLLECTIONS.ROOM_INVITATIONS),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      const batch = [];
      for (const docSnap of querySnapshot.docs) {
        const invitation = docSnap.data() as RoomInvitation;
        if (invitation.expiresAt < now) {
          batch.push(
            updateDoc(doc(db, COLLECTIONS.ROOM_INVITATIONS, docSnap.id), {
              isActive: false,
            })
          );
        }
      }

      await Promise.all(batch);
    }, "Failed to cleanup expired invitations");
  }
}
