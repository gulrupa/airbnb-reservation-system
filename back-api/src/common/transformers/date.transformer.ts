import { Transform } from 'class-transformer';

/**
 * Transforme une string de date (YYYY-MM-DD ou ISO 8601) en objet Date
 */
export function TransformDate() {
  return Transform(({ value }) => {
    if (value === null || value === undefined) {
      return value;
    }

    // Si c'est déjà un objet Date, le retourner tel quel
    if (value instanceof Date) {
      return value;
    }

    // Si c'est une string, la convertir en Date
    if (typeof value === 'string') {
      // Si c'est au format YYYY-MM-DD, ajouter l'heure à minuit UTC
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyRegex.test(value)) {
        // Ajouter l'heure à minuit UTC pour éviter les problèmes de timezone
        return new Date(`${value}T00:00:00.000Z`);
      }

      // Sinon, essayer de parser directement (format ISO 8601)
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return value;
  });
}

