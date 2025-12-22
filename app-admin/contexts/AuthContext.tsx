'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getKeycloak, initKeycloak } from '@/lib/keycloak';
import type Keycloak from 'keycloak-js';

interface AuthContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);

  useEffect(() => {
    // Ne s'exécute que côté client
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const kc = getKeycloak();
    if (!kc) {
      setLoading(false);
      return;
    }

    setKeycloak(kc);

    initKeycloak()
      .then((authenticated) => {
        setAuthenticated(authenticated);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    kc.onTokenExpired = () => {
      kc.updateToken(30).catch(() => {
        setAuthenticated(false);
      });
    };

    kc.onAuthSuccess = () => {
      setAuthenticated(true);
    };

    kc.onAuthLogout = () => {
      setAuthenticated(false);
    };
  }, []);

  const login = () => {
    if (keycloak) {
      keycloak.login();
    }
  };

  const logout = () => {
    if (keycloak) {
      keycloak.logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

