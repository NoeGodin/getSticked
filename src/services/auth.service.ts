import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { AuthUser } from "../types/auth.types";
import { COLLECTIONS, createTimestamp } from "../utils/firestore";
import { ValidationUtils, withErrorHandler } from "../utils/service";

export class AuthService {
  static async createAccount(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthUser> {
    ValidationUtils.validateRequired(email, "Email");
    ValidationUtils.validateRequired(password, "Password");
    ValidationUtils.validateRequired(displayName, "Display name");
    ValidationUtils.validateEmail(email);

    return withErrorHandler(async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
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
        createdAt: createTimestamp(),
        lastSignIn: createTimestamp(),
        joinedRooms: {},
      };

      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);

      return userData;
    }, "Erreur lors de la création du compte");
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    ValidationUtils.validateRequired(email, "Email");
    ValidationUtils.validateRequired(password, "Password");
    ValidationUtils.validateEmail(email);

    return withErrorHandler(async () => {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update last sign in
      const userData: Partial<AuthUser> = {
        lastSignIn: createTimestamp(),
      };

      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);

      return await AuthService.getUserData(user.uid);
    }, "Erreur lors de la connexion");
  }

  static async signOut(): Promise<void> {
    return withErrorHandler(async () => {
      await signOut(auth);
    }, "Erreur lors de la déconnexion");
  }

  static async getUserData(uid: string): Promise<AuthUser> {
    return withErrorHandler(async () => {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (userDoc.exists()) {
        return userDoc.data() as AuthUser;
      }
      throw new Error("Utilisateur non trouvé");
    }, "Erreur lors de la récupération des données utilisateur");
  }
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static async updateUserProfile(updates: Partial<AuthUser>): Promise<void> {
    return withErrorHandler(async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      // Update in Firestore
      await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), {
        ...updates,
        updatedAt: createTimestamp(),
      });

      // Update Firebase Auth profile if displayName is being updated
      if (updates.displayName) {
        await updateProfile(currentUser, {
          displayName: updates.displayName,
        });
      }
    }, "Erreur lors de la mise à jour du profil");
  }

  static async createUserDocument(userData: AuthUser): Promise<void> {
    return withErrorHandler(async () => {
      await setDoc(doc(db, COLLECTIONS.USERS, userData.uid), userData);
    }, "Erreur lors de la création du document utilisateur");
  }
}
