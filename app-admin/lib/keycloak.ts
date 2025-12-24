import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://gul-si.fr/',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'gsi-booking',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'app-admin',
};

// Ne créer Keycloak que côté client
let keycloakInstance: Keycloak | null = null;

export const getKeycloak = (): Keycloak | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  
  return keycloakInstance;
};

export const keycloak = typeof window !== 'undefined' ? getKeycloak() : null;

export const initKeycloak = (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }
  
  const kc = getKeycloak();
  if (!kc) {
    return Promise.resolve(false);
  }
  
  return kc.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256',
  });
};

