'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getKeycloak, initKeycloak, keycloakConfig } from '@/lib/keycloak';
import type Keycloak from 'keycloak-js';

interface AuthContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
  isAdmin: () => false,
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

  const hasRole = (role: string): boolean => {
    if (!keycloak || !authenticated) {
      return false;
    }

    // Vérifier les rôles du realm
    const realmRoles = keycloak.realmAccess?.roles || [];
    if (realmRoles.includes(role)) {
      return true;
    }

    // Vérifier les rôles du client
    const clientId = keycloakConfig.clientId;
    const clientRoles = keycloak.resourceAccess?.[clientId]?.roles || [];
    if (clientRoles.includes(role)) {
      return true;
    }

    // Vérifier dans le token parsé
    const tokenParsed = keycloak.tokenParsed as any;
    if (tokenParsed?.realm_access?.roles?.includes(role)) {
      return true;
    }
    if (tokenParsed?.resource_access?.[clientId]?.roles?.includes(role)) {
      return true;
    }

    return false;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authenticated,
        loading,
        login,
        logout,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

