import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getAuthToken, logout } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await getAuthToken();
          setAuthToken(token);
          // In a real app, you would also fetch backend user profile here
          // using the token in the Authorization header.
        } catch (error) {
          console.error("Error fetching token on auth change:", error);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    authToken,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
