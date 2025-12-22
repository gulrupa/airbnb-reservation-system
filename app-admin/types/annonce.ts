import type { CalendarUrl } from './calendar';

/**
 * Interface représentant une annonce dans la base de données
 * Une annonce peut être associée à plusieurs calendriers
 */
export interface Annonce {
  /** ID MongoDB unique de l'annonce */
  _id: string;
  /** ID interne unique généré (UUID) */
  internalId: string;
  /** Titre de l'annonce */
  title: string;
  /** Description optionnelle de l'annonce */
  description?: string;
  /** Adresse de l'annonce */
  address?: string;
  /** Liste des calendriers associés (populés avec les données complètes) */
  calendarUrlIds?: (string | CalendarUrl)[];
  /** Liste des annonces qui bloquent cette annonce (populés avec les données complètes) */
  blockedByAnnonceIds?: (string | Annonce)[];
  /** Date de création */
  createdAt: string;
  /** Date de dernière modification */
  updatedAt: string;
}

/**
 * DTO pour créer une nouvelle annonce
 */
export interface CreateAnnonceDto {
  /** Titre de l'annonce (obligatoire) */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Adresse optionnelle */
  address?: string;
  /** Liste des IDs des calendriers à associer */
  calendarUrlIds?: string[];
  /** Liste des IDs des annonces qui bloquent cette annonce */
  blockedByAnnonceIds?: string[];
}

/**
 * DTO pour mettre à jour une annonce existante
 * Tous les champs sont optionnels (mise à jour partielle)
 */
export interface UpdateAnnonceDto {
  /** Nouveau titre */
  title?: string;
  /** Nouvelle description */
  description?: string;
  /** Nouvelle adresse */
  address?: string;
  /** Nouvelle liste d'IDs de calendriers */
  calendarUrlIds?: string[];
  /** Nouvelle liste d'IDs d'annonces qui bloquent cette annonce */
  blockedByAnnonceIds?: string[];
}

