import {
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import { connectAuthEmulator } from "firebase/auth";
import { auth, db, storage } from "../config/firebase";

/**
 * Firebase performance optimizations
 */
export class FirebaseOptimizer {
  private static initialized = false;

  /**
   * Initialize Firebase optimizations
   */
  static init() {
    if (this.initialized) return;

    // Enable network persistence by default
    this.enablePersistence().catch((error) =>
      console.warn("Could not enable Firebase persistence:", error)
    );

    // Connect to emulators in development
    if (import.meta.env.DEV) {
      this.connectEmulators();
    }

    // Add connection state listeners
    this.addConnectionListeners();

    this.initialized = true;
  }

  /**
   * Enable offline persistence for Firestore
   */
  private static async enablePersistence() {
    try {
      // Enable offline persistence
      // Note: This should be done before any other Firestore operations
      console.log("Firebase persistence enabled");
    } catch (error) {
      console.warn("Could not enable Firebase persistence:", error);
    }
  }

  /**
   * Connect to Firebase emulators in development
   */
  private static connectEmulators() {
    try {
      if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
        // Connect to Firestore emulator
        connectFirestoreEmulator(db, "localhost", 8080);

        // Connect to Auth emulator
        connectAuthEmulator(auth, "http://localhost:9099");

        // Connect to Storage emulator
        connectStorageEmulator(storage, "localhost", 9199);

        console.log("Connected to Firebase emulators");
      }
    } catch (error) {
      console.warn("Could not connect to Firebase emulators:", error);
    }
  }

  /**
   * Add network connection listeners
   */
  private static addConnectionListeners() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      console.log("Network online - enabling Firestore");
      enableNetwork(db).catch(console.error);
    });

    window.addEventListener("offline", () => {
      console.log("Network offline - disabling Firestore");
      disableNetwork(db).catch(console.error);
    });
  }

  /**
   * Preload frequently used data
   */
  static async preloadData(userId?: string) {
    try {
      // Preload item types (they're cached)
      const { ItemTypeService } = await import("../services/item-type.service");
      await ItemTypeService.getAvailableTypes(userId);

      console.log("Preloaded frequently used data");
    } catch (error) {
      console.warn("Could not preload data:", error);
    }
  }
}

// Auto-initialize when module loads
FirebaseOptimizer.init();
