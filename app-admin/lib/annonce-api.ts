import { api } from './api';
import type { Annonce, CreateAnnonceDto, UpdateAnnonceDto } from '@/types/annonce';

/**
 * Service API pour la gestion des annonces
 * Fournit toutes les méthodes nécessaires pour interagir avec l'API backend
 * concernant les annonces et leurs calendriers associés
 */
export const annonceApi = {
  /**
   * Récupère toutes les annonces
   * @returns Liste de toutes les annonces enregistrées
   */
  getAll: async (): Promise<Annonce[]> => {
    return api.get<Annonce[]>('/annonces');
  },

  /**
   * Récupère une annonce par son ID
   * @param id - ID MongoDB de l'annonce
   * @returns Les données de l'annonce
   */
  getById: async (id: string): Promise<Annonce> => {
    return api.get<Annonce>(`/annonces/${id}`);
  },

  /**
   * Crée une nouvelle annonce
   * @param data - Données de l'annonce à créer
   * @returns L'annonce créée avec son ID
   */
  create: async (data: CreateAnnonceDto): Promise<Annonce> => {
    return api.post<Annonce>('/annonces', data);
  },

  /**
   * Met à jour une annonce existante
   * @param id - ID MongoDB de l'annonce à mettre à jour
   * @param data - Données partielles à mettre à jour
   * @returns L'annonce mise à jour
   */
  update: async (id: string, data: UpdateAnnonceDto): Promise<Annonce> => {
    return api.put<Annonce>(`/annonces/${id}`, data);
  },

  /**
   * Supprime une annonce
   * @param id - ID MongoDB de l'annonce à supprimer
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/annonces/${id}`);
  },
};

