/**
 * Interface représentant un calendrier dans la base de données
 * Un calendrier contient une URL iCal et des métadonnées
 */
export interface CalendarUrl {
  /** ID MongoDB unique du calendrier */
  _id: string;
  /** URL du calendrier iCal (obligatoire, unique) */
  url: string;
  /** Nom optionnel du calendrier */
  name?: string;
  /** Description optionnelle du calendrier */
  description?: string;
  /** Plateforme source (airbnb, booking, etc.) */
  platform: string;
  /** Indique si le calendrier est actif (utilisé pour la synchronisation) */
  isActive: boolean;
  /** Date de création */
  createdAt: string;
  /** Date de dernière modification */
  updatedAt: string;
}

/**
 * DTO pour créer un nouveau calendrier
 * Tous les champs sauf isActive sont optionnels sauf url et platform
 */
export interface CreateCalendarUrlDto {
  /** URL du calendrier iCal (obligatoire) */
  url: string;
  /** Nom optionnel du calendrier */
  name?: string;
  /** Description optionnelle */
  description?: string;
  /** Plateforme source (obligatoire) */
  platform: string;
  /** Statut actif par défaut (true) */
  isActive?: boolean;
}

/**
 * DTO pour mettre à jour un calendrier existant
 * Tous les champs sont optionnels (mise à jour partielle)
 */
export interface UpdateCalendarUrlDto {
  /** Nouvelle URL du calendrier */
  url?: string;
  /** Nouveau nom */
  name?: string;
  /** Nouvelle description */
  description?: string;
  /** Nouvelle plateforme */
  platform?: string;
  /** Nouveau statut actif/inactif */
  isActive?: boolean;
}

/**
 * Interface représentant une réservation dans la base de données
 * Une réservation est associée à un calendrier et contient les détails de la réservation
 */
export interface Reservation {
  /** ID MongoDB unique de la réservation */
  _id: string;
  /** ID interne unique généré (UUID) */
  internalId: string;
  /** ID externe de la réservation (ex: ID Airbnb) */
  externalId: string;
  /** Prix de la réservation en euros */
  price: number;
  /** Date de début de la réservation (ISO 8601) */
  startDate: string;
  /** Date de fin de la réservation (ISO 8601) */
  endDate: string;
  /** Nombre de voyageurs */
  numberOfTravelers: number;
  /** Type de réservation : 'reservation' ou 'manual_block_date' */
  type?: string;
  /** ID du calendrier associé (référence MongoDB) */
  calendarUrlId?: string;
  /** Date de création */
  createdAt: string;
  /** Date de dernière modification */
  updatedAt: string;
}

