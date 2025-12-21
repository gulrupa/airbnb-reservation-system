# Airbnb Reservation System API

API NestJS pour la gestion des réservations et des calendriers Airbnb.

## 🚀 Fonctionnalités

- **Gestion des réservations** : CRUD complet pour les réservations
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

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/airbnb-reservations` |
| `PORT` | Port d'écoute de l'API | `3000` |

## 📄 License

MIT
