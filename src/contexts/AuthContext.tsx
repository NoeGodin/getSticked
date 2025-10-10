import React, { createContext, useEffect, useState } from "react";
import { AuthService } from "../services/auth.service";
import type { AuthContextType, AuthUser } from "../types/auth.types";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return AuthService.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          let userData;
          try {
            userData = await AuthService.getUserData(firebaseUser.uid);
          } catch {
            // If user doesn't exist in Firestore, create them
            console.log(
              "User not found in Firestore, creating new user document"
            );
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Utilisateur",
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date().toISOString(),
              lastSignIn: new Date().toISOString(),
              joinedRooms: {},
              ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
            };

            // Create user document in Firestore
            await AuthService.createUserDocument(userData);
          }
          setUser(userData);
        } catch (error) {
          console.error("Error loading user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const userData = await AuthService.signIn(email, password);
    setUser(userData);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const userData = await AuthService.createAccount(
      email,
      password,
      displayName
    );
    setUser(userData);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    await AuthService.updateUserProfile(updates);
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
