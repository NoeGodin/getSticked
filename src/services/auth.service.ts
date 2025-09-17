import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import type { AuthUser } from "../types/auth.types";

const USERS_COLLECTION = "users";

export class AuthService {
  static async createAccount(email: string, password: string, displayName: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore
      const userData: AuthUser = {
        uid: user.uid,
        email: user.email!,
        displayName,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastSignIn: new Date().toISOString(),
        joinedRooms: []
      };

      await setDoc(doc(db, USERS_COLLECTION, user.uid), userData);

      return userData;
    } catch (error: any) {
      throw new Error(`Erreur lors de la création du compte: ${error.message}`);
    }
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last sign in
      const userData: Partial<AuthUser> = {
        lastSignIn: new Date().toISOString()
      };

      await updateDoc(doc(db, USERS_COLLECTION, user.uid), userData);

      return await AuthService.getUserData(user.uid);
    } catch (error: any) {
      throw new Error(`Erreur lors de la connexion: ${error.message}`);
    }
  }


  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(`Erreur lors de la déconnexion: ${error.message}`);
    }
  }

  static async getUserData(uid: string): Promise<AuthUser> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        return userDoc.data() as AuthUser;
      }
      throw new Error("Utilisateur non trouvé");
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des données utilisateur: ${error.message}`);
    }
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static async updateUserProfile(updates: Partial<AuthUser>): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      // Update in Firestore
      await updateDoc(doc(db, USERS_COLLECTION, currentUser.uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Update Firebase Auth profile if displayName is being updated
      if (updates.displayName) {
        await updateProfile(currentUser, { displayName: updates.displayName });
      }
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    }
  }

}