import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Web stub — Firebase Auth is not available on web */
export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    user: null,
    loading: false,
    signInWithGoogle: async () => {
      throw new Error('Google Sign-In is not supported on web');
    },
    signOut: async () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
