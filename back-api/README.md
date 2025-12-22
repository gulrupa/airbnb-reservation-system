# Airbnb Reservation System API

API NestJS pour la gestion des réservations et des calendriers Airbnb.

## 🚀 Fonctionnalités

- **Gestion des réservations** : CRUD complet pour les réservations
- **Gestion des annonces** : CRUD complet pour les annonces avec association de calendriers
- **Gestion des URLs de calendrier** : Stockage et gestion des URLs de calendrier iCal
- **Intégration Airbnb** : Récupération et parsing automatique des calendriers Airbnb
- **Validation des données** : Validation automatique avec support des dates au format `YYYY-MM-DD` ou ISO 8601
- **Logging avancé** : Logging complet de toutes les requêtes et erreurs
- **Documentation API** : Documentation Swagger/OpenAPI interactive
- **Architecture SOLID** : Architecture modulaire respectant les principes SOLID

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- MongoDB
- npm ou yarn

## 🔧 Installation

```bash
# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Configurer MongoDB dans .env
MONGODB_URI=mongodb://localhost:27017/airbnb-reservations
PORT=3000
```

## 🏃 Démarrage

```bash
# Mode développement (avec watch)
npm run start:dev

# Mode production
npm run start:prod

# Build
npm run build
```

## 📚 Documentation API

Une fois l'application démarrée, la documentation Swagger est accessible à :

```
http://localhost:3000/api
```

Voir [README.API.md](./README.API.md) pour plus de détails.

## 📋 Modules disponibles

### Réservations (`/reservations`)

Gestion complète des réservations avec support des dates et types (réservation, blocage manuel).

**Endpoints principaux :**
- `GET /reservations` : Liste toutes les réservations
- `GET /reservations/:id` : Récupère une réservation par ID
- `POST /reservations` : Crée une nouvelle réservation
- `PUT /reservations/:id` : Met à jour une réservation
- `DELETE /reservations/:id` : Supprime une réservation
- `GET /reservations/user/:userId` : Récupère les réservations d'un utilisateur
- `GET /reservations/property/:propertyId` : Récupère les réservations d'une propriété
- `GET /reservations/date-range/start/:startDate/end/:endDate` : Récupère les réservations dans une plage de dates

### Annonces (`/annonces`)

Gestion des annonces avec association de calendriers par ID.

**Endpoints principaux :**
- `GET /annonces` : Liste toutes les annonces (avec calendriers associés)
- `GET /annonces/:id` : Récupère une annonce par ID (avec calendriers associés)
- `POST /annonces` : Crée une nouvelle annonce
- `PUT /annonces/:id` : Met à jour une annonce
- `DELETE /annonces/:id` : Supprime une annonce

**Exemple de création d'annonce :**
```json
POST /annonces
{
  "title": "Appartement cosy au centre-ville",
  "description": "Magnifique appartement de 50m² avec vue sur la ville",
  "address": "123 Rue de la Paix, 75001 Paris",
  "calendarUrlIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Note :** Les `calendarUrlIds` doivent être des IDs MongoDB valides de calendriers existants. La validation est effectuée automatiquement lors de la création ou de la mise à jour.

### URLs de calendrier (`/calendar-urls`)

Gestion des URLs de calendrier iCal pour la synchronisation automatique.

**Endpoints principaux :**
- `GET /calendar-urls` : Liste toutes les URLs de calendrier
- `GET /calendar-urls/:id` : Récupère une URL de calendrier par ID
- `POST /calendar-urls` : Crée une nouvelle URL de calendrier
- `PUT /calendar-urls/:id` : Met à jour une URL de calendrier
- `DELETE /calendar-urls/:id` : Supprime une URL de calendrier

## 🏗️ Architecture

Le projet suit une architecture en couches :

```
src/
├── common/              # Utilitaires partagés
│   ├── decorators/      # Décorateurs personnalisés
│   ├── filters/         # Filtres d'exception
│   ├── interceptors/    # Intercepteurs HTTP
│   └── transformers/    # Transformateurs de données
├── reservation/
│   ├── domain/          # Entités et interfaces métier
│   ├── application/     # Services et DTOs
│   ├── infrastructure/  # Implémentations techniques
│   └── presentation/    # Contrôleurs et modules
├── annonce/
│   ├── domain/          # Entités et interfaces métier
│   ├── application/     # Services et DTOs
│   ├── infrastructure/  # Implémentations techniques
│   └── presentation/    # Contrôleurs et modules
└── app.module.ts        # Module racine
```

### Principes SOLID

- **Single Responsibility** : Chaque classe a une responsabilité unique
- **Open/Closed** : Extensible via interfaces sans modification
- **Liskov Substitution** : Les implémentations respectent leurs interfaces
- **Interface Segregation** : Interfaces spécifiques et ciblées
- **Dependency Inversion** : Dépendances via interfaces, pas d'implémentations concrètes

## 🔍 Logging

Le système de logging est configuré pour capturer :

- Toutes les requêtes HTTP (méthode, URL, paramètres)
- Toutes les réponses (statut, temps de traitement)
- Toutes les erreurs (stack trace complète)
- Détails des requêtes en cas d'erreur

Les niveaux de logging disponibles : `error`, `warn`, `log`, `debug`, `verbose`

## ✅ Validation

### Dates

Les dates acceptent deux formats :
- Format simple : `YYYY-MM-DD` (ex: `2025-12-21`)
- Format ISO 8601 : `2025-12-21T00:00:00.000Z`

Les dates au format simple sont automatiquement converties en objets `Date` avec l'heure à minuit UTC.

### Validation automatique

- Validation des DTOs avec `class-validator`
- Transformation automatique des types
- Messages d'erreur détaillés

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de code
npm run test:cov
```

## 📦 Technologies utilisées

- **NestJS** : Framework Node.js
- **MongoDB** : Base de données
- **Mongoose** : ODM pour MongoDB
- **Swagger** : Documentation API
- **class-validator** : Validation des données
- **class-transformer** : Transformation des données
- **ical.js** : Parsing des calendriers iCal
- **Axios** : Client HTTP

## 📝 Scripts disponibles

```bash
npm run build          # Compiler le projet
npm run start          # Démarrer l'application
npm run start:dev      # Démarrer en mode développement
npm run start:prod     # Démarrer en mode production
npm run lint           # Linter le code
npm run format         # Formater le code avec Prettier
```

## 🔐 Variables d'environnement

| Variable | Description | Exemple | Défaut |
|----------|-------------|---------|--------|
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/airbnb-reservations` | - |
| `PORT` | Port d'écoute de l'API | `3000` | `3000` |
| `CALENDAR_SYNC_CRON` | Expression cron pour la synchronisation automatique | `0 * * * *` (toutes les heures) | `0 * * * *` |
| `LOG_LEVEL` | Niveaux de log activés (séparés par des virgules) | `error,warn,log,debug,verbose` | `error,warn,log,debug,verbose` |

### Format de l'expression cron

L'expression cron suit le format standard : `minute heure jour mois jour-semaine`

Exemples :
- `0 * * * *` : Toutes les heures à la minute 0
- `*/30 * * * *` : Toutes les 30 minutes
- `0 0 * * *` : Tous les jours à minuit
- `0 0 * * 1` : Tous les lundis à minuit
- `0 9,17 * * *` : À 9h et 17h tous les jours

### Niveaux de log

Les niveaux de log disponibles sont : `error`, `warn`, `log`, `debug`, `verbose`

Exemples de configuration :
- `error,warn,log` : Production (seulement les erreurs, avertissements et logs)
- `error,warn,log,debug` : Développement (avec debug)
- `error,warn,log,debug,verbose` : Développement détaillé (tous les niveaux)

## 📄 License

MIT
