import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  }>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  useEffect(() => {
    // Load from localStorage
    const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('eduverse_token');
    const storedUser = localStorage.getItem('user') || localStorage.getItem('eduverse_user');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Failed to load auth state:', error);
      }
    }

    // Listen for profile updates
    const handleProfileUpdate = (event: Event) => {
      console.log('AuthContext: Profile update event received');
      const updatedUser = localStorage.getItem('eduverse_user');
      if (updatedUser) {
        try {
          const user = JSON.parse(updatedUser);
          console.log('AuthContext: Updating user state:', user);
          setAuthState(prev => ({
            ...prev,
            user
          }));
        } catch (error) {
          console.error('Failed to parse updated user:', error);
        }
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  const updateUser = (user: User) => {
    console.log('AuthContext: updateUser called with:', user);
    setAuthState(prev => ({
      ...prev,
      user
    }));
    localStorage.setItem('eduverse_user', JSON.stringify(user));
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('eduverse_token');
    localStorage.removeItem('user');
    localStorage.removeItem('eduverse_user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false
    });
  };

  return (
    <AuthContext.Provider value={{
      user: authState.user,
      token: authState.token,
      isAuthenticated: authState.isAuthenticated,
      updateUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
