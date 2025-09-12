import type { UserSession, JoinedRoom } from "../types/session.types";

const STORAGE_KEY = 'userSession';
const BACKUP_KEY = 'userSession_backup';

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private listeners: Array<(session: UserSession) => void> = [];

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private validateSession(data: any): data is UserSession {
    if (!data || typeof data !== 'object') return false;
    
    if (!Array.isArray(data.joinedRooms)) return false;
    
    for (const room of data.joinedRooms) {
      if (!room || typeof room !== 'object') return false;
      if (typeof room.name !== 'string' || !room.name.trim()) return false;
      if (typeof room.secretKey !== 'string' || !room.secretKey.trim()) return false;
      if (typeof room.joinedAt !== 'string') return false;
      
      // Validate ISO date
      const joinedDate = new Date(room.joinedAt);
      if (isNaN(joinedDate.getTime())) return false;
      
      if (room.lastVisited && typeof room.lastVisited !== 'string') return false;
      if (room.lastVisited) {
        const lastVisitedDate = new Date(room.lastVisited);
        if (isNaN(lastVisitedDate.getTime())) return false;
      }
    }
    
    if (data.currentRoomName && typeof data.currentRoomName !== 'string') return false;
    
    return true;
  }

  private createEmptySession(): UserSession {
    return {
      joinedRooms: [],
      currentRoomName: undefined,
    };
  }

  private safeJsonParse(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return null;
    }
  }

  private safeLocalStorageGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage (${key}):`, error);
      return null;
    }
  }

  private safeLocalStorageSet(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to write to localStorage (${key}):`, error);
      return false;
    }
  }

  private createBackup(session: UserSession): void {
    const backupData = {
      session,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    this.safeLocalStorageSet(BACKUP_KEY, JSON.stringify(backupData));
  }

  private tryRestoreFromBackup(): UserSession | null {
    const backupData = this.safeLocalStorageGet(BACKUP_KEY);
    if (!backupData) return null;

    const parsed = this.safeJsonParse(backupData);
    if (!parsed || !parsed.session) return null;

    if (this.validateSession(parsed.session)) {
      console.info('Session restored from backup');
      return parsed.session;
    }

    return null;
  }

  loadSession(): UserSession {
    try {
      // Try to load from main storage
      const savedData = this.safeLocalStorageGet(STORAGE_KEY);
      
      if (savedData) {
        const parsed = this.safeJsonParse(savedData);
        
        if (this.validateSession(parsed)) {
          this.currentSession = parsed;
          return parsed;
        } else {
          console.warn('Invalid session data found, attempting backup restore');
        }
      }

      // Try backup restore
      const backupSession = this.tryRestoreFromBackup();
      if (backupSession) {
        this.currentSession = backupSession;
        this.saveSession(backupSession); // Restore to main storage
        return backupSession;
      }

      // Create new empty session
      const emptySession = this.createEmptySession();
      this.currentSession = emptySession;
      this.saveSession(emptySession);
      return emptySession;

    } catch (error) {
      console.error('Critical error loading session:', error);
      const emptySession = this.createEmptySession();
      this.currentSession = emptySession;
      return emptySession;
    }
  }

  saveSession(session: UserSession): boolean {
    try {
      if (!this.validateSession(session)) {
        console.error('Invalid session data, cannot save');
        return false;
      }

      // Create backup before saving
      if (this.currentSession) {
        this.createBackup(this.currentSession);
      }

      const serialized = JSON.stringify(session);
      const success = this.safeLocalStorageSet(STORAGE_KEY, serialized);
      
      if (success) {
        this.currentSession = session;
        this.notifyListeners(session);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  addRoom(room: JoinedRoom): boolean {
    if (!this.currentSession) {
      this.loadSession();
    }

    if (!this.currentSession) return false;

    // Validate room data
    if (!room.name?.trim() || !room.secretKey?.trim() || !room.joinedAt) {
      console.error('Invalid room data');
      return false;
    }

    // Check if room already exists
    const existingIndex = this.currentSession.joinedRooms.findIndex(
      r => r.name === room.name && r.secretKey === room.secretKey
    );

    const updatedSession = { ...this.currentSession };

    if (existingIndex >= 0) {
      // Update existing room
      updatedSession.joinedRooms[existingIndex] = {
        ...updatedSession.joinedRooms[existingIndex],
        lastVisited: new Date().toISOString()
      };
    } else {
      // Add new room
      updatedSession.joinedRooms.push({
        ...room,
        lastVisited: room.lastVisited || new Date().toISOString()
      });
    }

    return this.saveSession(updatedSession);
  }

  removeRoom(roomName: string): boolean {
    if (!this.currentSession) {
      this.loadSession();
    }

    if (!this.currentSession) return false;

    const updatedSession = { ...this.currentSession };
    updatedSession.joinedRooms = updatedSession.joinedRooms.filter(
      room => room.name !== roomName
    );

    // Clear current room if it was the removed room
    if (updatedSession.currentRoomName === roomName) {
      updatedSession.currentRoomName = undefined;
    }

    return this.saveSession(updatedSession);
  }

  setCurrentRoom(roomName: string | undefined): boolean {
    if (!this.currentSession) {
      this.loadSession();
    }

    if (!this.currentSession) return false;

    // Validate room exists if not undefined
    if (roomName && !this.currentSession.joinedRooms.find(r => r.name === roomName)) {
      console.error('Cannot set current room: room not found in joined rooms');
      return false;
    }

    const updatedSession = { 
      ...this.currentSession,
      currentRoomName: roomName
    };

    // Update lastVisited for the room
    if (roomName) {
      const roomIndex = updatedSession.joinedRooms.findIndex(r => r.name === roomName);
      if (roomIndex >= 0) {
        updatedSession.joinedRooms[roomIndex] = {
          ...updatedSession.joinedRooms[roomIndex],
          lastVisited: new Date().toISOString()
        };
      }
    }

    return this.saveSession(updatedSession);
  }

  getCurrentSession(): UserSession {
    if (!this.currentSession) {
      return this.loadSession();
    }
    return this.currentSession;
  }

  getCurrentRoom(): JoinedRoom | undefined {
    const session = this.getCurrentSession();
    if (!session.currentRoomName) return undefined;
    
    return session.joinedRooms.find(room => room.name === session.currentRoomName);
  }

  // Event system for session changes
  subscribe(listener: (session: UserSession) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(session: UserSession): void {
    this.listeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  // Debug methods
  getBackupInfo(): any {
    const backupData = this.safeLocalStorageGet(BACKUP_KEY);
    if (!backupData) return null;
    
    return this.safeJsonParse(backupData);
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      this.currentSession = null;
      console.info('All session data cleared');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();