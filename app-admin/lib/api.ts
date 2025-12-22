import { getKeycloak } from './keycloak';

/**
 * URL de base de l'API backend
 * Récupérée depuis les variables d'environnement ou valeur par défaut
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Récupère les en-têtes HTTP avec l'authentification Keycloak
 * Ajoute automatiquement le token Bearer si l'utilisateur est authentifié
 * @returns Les en-têtes HTTP avec l'authentification
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const keycloak = getKeycloak();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Ajoute le token d'authentification Keycloak si disponible
  if (keycloak?.token) {
    headers['Authorization'] = `Bearer ${keycloak.token}`;
  }

  return headers;
}

/**
 * Fonction générique pour effectuer des requêtes HTTP vers l'API
 * Gère automatiquement l'authentification et les erreurs
 * @param endpoint - Chemin de l'endpoint API (ex: '/calendar-urls')
 * @param options - Options de la requête HTTP (méthode, body, etc.)
 * @returns Les données de la réponse parsées en JSON
 * @throws Error si la requête échoue
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // Gestion des erreurs HTTP
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Objet API avec les méthodes HTTP courantes
 * Simplifie l'utilisation des requêtes API avec typage TypeScript
 */
export const api = {
  /** Effectue une requête GET */
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  /** Effectue une requête POST avec des données */
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  /** Effectue une requête PUT avec des données */
  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  /** Effectue une requête DELETE */
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

