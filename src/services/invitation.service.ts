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

const INVITATIONS_COLLECTION = "room_invitations";

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
    createdBy: AuthUser,
  ): Promise<InvitationLinkData> {
    try {
      // Verify user owns the room
      const room = await RoomService.getRoomById(request.roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Check if user has access to the room (is owner or member)
      const userData = await UserService.getUserById(createdBy.uid);
      const isOwner = room.owner.uid === createdBy.uid;
      const isMember = userData?.joinedRooms?.includes(request.roomId) || false;
      
      if (!isOwner && !isMember) {
        throw new Error("Only room members can create invitations");
      }

      // Calculate expiration (default 24 hours)
      const expiresInHours = request.expiresInHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Generate unique token
      const token = generateInvitationToken();

      // Create invitation object (omit undefined fields for Firestore)
      const invitation: any = {
        roomId: request.roomId,
        token,
        createdBy: {
          uid: createdBy.uid,
          displayName: createdBy.displayName,
        },
        createdAt: new Date().toISOString(),
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
      await addDoc(collection(db, INVITATIONS_COLLECTION), invitation);

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
    } catch (error) {
      throw new Error(`Failed to create invitation: ${error}`);
    }
  }

  /**
   * Validate and use an invitation token
   */
  static async useInvitation(
    token: string,
    user: AuthUser,
  ): Promise<{ roomId: string; roomName: string }> {
    try {
      // Find invitation by token
      const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where("token", "==", token),
        where("isActive", "==", true),
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
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitation.id!), {
          isActive: false,
        });
        throw new Error("This invitation link has expired");
      }

      // Check usage limit
      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitation.id!), {
          isActive: false,
        });
        throw new Error("This invitation link has reached its usage limit");
      }

      // Check if user is already in the room
      const userData = await UserService.getUserById(user.uid);
      const isAlreadyJoined =
        userData?.joinedRooms?.includes(invitation.roomId) || false;

      // Check if user is the owner
      const room = await RoomService.getRoomById(invitation.roomId);
      const isOwner = room?.owner.uid === user.uid;

      if (!isOwner && !isAlreadyJoined) {
        // Add user to room
        await UserService.addRoomToUser(user.uid, invitation.roomId);
      }

      // Increment usage count
      await updateDoc(doc(db, INVITATIONS_COLLECTION, invitation.id!), {
        usedCount: invitation.usedCount + 1,
      });

      return {
        roomId: invitation.roomId,
        roomName: invitation.roomName,
      };
    } catch (error) {
      throw new Error(`Failed to use invitation: ${error}`);
    }
  }

  /**
   * Get all active invitations for a room
   */
  static async getRoomInvitations(
    roomId: string,
    userId: string,
  ): Promise<RoomInvitation[]> {
    try {
      // Verify user owns the room
      const room = await RoomService.getRoomById(roomId);
      if (!room || room.owner.uid !== userId) {
        throw new Error("Only room owner can view invitations");
      }

      const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where("roomId", "==", roomId),
        where("isActive", "==", true),
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RoomInvitation[];
    } catch (error) {
      throw new Error(`Failed to get room invitations: ${error}`);
    }
  }

  /**
   * Deactivate an invitation
   */
  static async deactivateInvitation(
    invitationId: string,
    userId: string,
  ): Promise<void> {
    try {
      const invitationDoc = await getDoc(
        doc(db, INVITATIONS_COLLECTION, invitationId),
      );

      if (!invitationDoc.exists()) {
        throw new Error("Invitation not found");
      }

      const invitation = invitationDoc.data() as RoomInvitation;

      // Verify user owns the room
      const room = await RoomService.getRoomById(invitation.roomId);
      if (!room || room.owner.uid !== userId) {
        throw new Error("Only room owner can deactivate invitations");
      }

      await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
        isActive: false,
      });
    } catch (error) {
      throw new Error(`Failed to deactivate invitation: ${error}`);
    }
  }

  /**
   * Clean up expired invitations (utility function)
   */
  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where("isActive", "==", true),
      );

      const querySnapshot = await getDocs(q);

      const batch = [];
      for (const docSnap of querySnapshot.docs) {
        const invitation = docSnap.data() as RoomInvitation;
        if (invitation.expiresAt < now) {
          batch.push(
            updateDoc(doc(db, INVITATIONS_COLLECTION, docSnap.id), {
              isActive: false,
            }),
          );
        }
      }

      await Promise.all(batch);
    } catch (error) {
      console.error("Failed to cleanup expired invitations:", error);
    }
  }
}
