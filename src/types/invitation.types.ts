export interface RoomInvitation {
  id?: string; // Firestore document ID
  roomId: string;
  token: string; // Unique UUID for the invitation
  createdBy: {
    uid: string;
    displayName: string;
  };
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  maxUses?: number; // Optional limit on uses
  usedCount: number;
  isActive: boolean;
  roomName: string; // For display purposes
}

export interface CreateInvitationRequest {
  roomId: string;
  expiresInHours?: number; // Default 24h
  maxUses?: number; // Optional
}

export interface InvitationLinkData {
  token: string;
  url: string;
  expiresAt: string;
  maxUses?: number;
}