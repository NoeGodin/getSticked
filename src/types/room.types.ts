export interface ActionHistory {
  id: string;
  type:
    | "item_added"
    | "item_removed"
    | "user_joined"
    | "user_left"
    | "room_updated";
  userId?: string; // ID of the concerned user
  performedBy: {
    uid: string;
    displayName: string;
  };
  timestamp: string;
  details?: string;
}

// Interface for a room (now without predefined players)
export interface Room {
  id?: string; // Firebase document ID
  name: string;
  description?: string;
  owner: {
    uid: string;
    displayName: string;
  };
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  history: ActionHistory[];
  memberIds: string[]; // List of user IDs who have items in this room
  itemTypeId: string; // ID du type d'item utilisé (obligatoire maintenant)
}

// Interface for creating a room (simplified)
export interface CreateRoomForm {
  name: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  items: import("./item-type.types").UserItem[];
  photoURL?: string;
  bio?: string;
}
