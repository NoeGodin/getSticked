export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string;
  emailVerified: boolean;
  isAnonymous?: boolean;
  createdAt: string;
  lastSignIn: string;
  updatedAt?: string;
  joinedRooms?: string[]; // Array of room IDs the user has joined
  photoURL?: string; // profile pic URL
  bio?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}
