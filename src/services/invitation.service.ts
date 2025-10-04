import {
  addDoc,
  collection,
  doc,
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
import { UserRoomItemsService } from "./userRoomItems.service";
import { COLLECTIONS, createTimestamp } from "../utils/firestore";
import { AuthUtils, ValidationUtils, withErrorHandler } from "../utils/service";

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
    ValidationUtils.validateRequired(request.roomId, "StickRoom ID");
    ValidationUtils.validateRequired(createdBy.uid, "User ID");

    return withErrorHandler(async () => {
      // Verify user owns the room
      const room = await RoomService.getRoomById(request.roomId);
      if (!room) {
        throw new Error("StickRoom not found");
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

      // Calculate expiration (default 7 days)
      const expiresInHours = request.expiresInHours || (7 * 24);
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
  static async consumeInvitation(
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
        // Ensure user has userRoomItems entry
        await UserRoomItemsService.joinRoom(user.uid, invitation.roomId);
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
}
