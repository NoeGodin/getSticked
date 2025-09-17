import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService } from "../services/auth.service";
import type { AuthUser, AuthContextType } from "../types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          const userData = await AuthService.getUserData(firebaseUser.uid);
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

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const userData = await AuthService.signIn(email, password);
    setUser(userData);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const userData = await AuthService.createAccount(email, password, displayName);
    setUser(userData);
  };

  const signInAnonymously = async () => {
    const userData = await AuthService.signInAnonymously();
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
    signInAnonymously,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};