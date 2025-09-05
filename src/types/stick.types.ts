export interface Stick {
  createdAt: string; // ISO string
  comment: string;
  count: number;
  isRemoved?: boolean; // Track if this is a removal entry
}
