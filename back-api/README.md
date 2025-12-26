# Airbnb Reservation System API

API NestJS pour la gestion des réservations et des calendriers Airbnb.

## 🚀 Fonctionnalités

- **Gestion des réservations** : CRUD complet pour les réservations
- **Gestion des annonces** : CRUD complet pour les annonces avec association de calendriers
- **Gestion des URLs de calendrier** : Stockage et gestion des URLs de calendrier iCal
- **Intégration Airbnb** : Récupération et parsing automatique des calendriers Airbnb
- **Synchronisation des emails Airbnb** : Récupération automatique des emails Airbnb via IMAP et stockage des événements (versements, créations, annulations de réservations)
- **Authentification Keycloak** : Protection de toutes les routes avec Keycloak via `nest-keycloak-connect`
- **Gestion des rôles** : Contrôle d'accès basé sur les rôles (admin, manager)
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

# Configurer MongoDB et Keycloak dans .env
MONGODB_URI=mongodb://localhost:27017/airbnb-reservations
PORT=3000
KEYCLOAK_URL=https://gul-si.fr/
KEYCLOAK_REALM=gsi-booking
KEYCLOAK_CLIENT_ID=app-admin
CORS_ORIGIN=http://localhost:3001
```

## 🔐 Configuration Keycloak et Rôles

L'API utilise Keycloak pour l'authentification et l'autorisation basée sur les rôles. Deux rôles sont utilisés :

- **`admin`** : Accès complet à tous les endpoints
- **`manager`** : Accès limité à certains endpoints (ex: `GET /reservations/future`)

### Configuration des rôles dans Keycloak

#### 1. Créer les rôles dans le realm

1. Connectez-vous à la console d'administration Keycloak
2. Sélectionnez votre realm (par défaut : `gsi-booking`)
3. Allez dans **Realm roles** (Rôles du realm)
4. Cliquez sur **Create role** (Créer un rôle)
5. Créez les deux rôles suivants :
   - `admin`
   - `manager`

#### 2. Assigner les rôles aux utilisateurs

1. Allez dans **Users** (Utilisateurs)
2. Sélectionnez l'utilisateur à configurer
3. Allez dans l'onglet **Role mapping** (Mappage des rôles)
4. Cliquez sur **Assign role** (Assigner un rôle)
5. Sélectionnez **Filter by realm roles** (Filtrer par rôles du realm)
6. Cochez les rôles souhaités (`admin` ou `manager`)
7. Cliquez sur **Assign** (Assigner)

#### 3. Configurer le client pour mapper les rôles

1. Allez dans **Clients** (Clients)
2. Sélectionnez votre client (par défaut : `app-admin`)
3. Allez dans l'onglet **Mappers** (Mappeurs)
4. Vérifiez qu'il existe un mapper de type **User Realm Role** ou **Client Role**
   - Si absent, créez-en un :
     - **Name** : `realm-roles`
     - **Mapper Type** : `User Realm Role`
     - **Token Claim Name** : `realm_access.roles` (ou laissez par défaut)
     - **Add to ID token** : `ON`
     - **Add to access token** : `ON`
     - **Add to userinfo** : `ON`

#### 4. Vérifier la configuration

Pour vérifier que les rôles sont correctement inclus dans le token JWT :

1. Connectez-vous avec un utilisateur ayant un rôle assigné
2. Récupérez le token JWT
3. Décodez le token (via [jwt.io](https://jwt.io) ou un outil similaire)
4. Vérifiez que le token contient les rôles dans `realm_access.roles` ou `resource_access.<client-id>.roles`

### Endpoints et rôles requis

| Endpoint | Méthode | Rôle requis |
|----------|---------|-------------|
| `/health` | GET | Public (aucun) |
| `/` | GET | `admin` |
| `/reservations/*` | Toutes | `admin` |
| `/reservations/future` | GET | `manager` |
| `/annonces/*` | Toutes | `admin` |
| `/calendar-urls/*` | Toutes | `admin` |
| `/statistiques/*` | Toutes | `admin` |
| `/jobs/*` | Toutes | `admin` |

### Test de l'authentification

Pour tester l'authentification avec un rôle spécifique :

1. **Obtenir un token** :
   ```bash
   curl -X POST "https://gul-si.fr/realms/gsi-booking/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=app-admin" \
     -d "username=votre_utilisateur" \
     -d "password=votre_mot_de_passe" \
     -d "grant_type=password"
   ```

2. **Utiliser le token** :
   ```bash
   curl -X GET "http://localhost:3000/reservations" \
     -H "Authorization: Bearer VOTRE_TOKEN_ICI"
   ```

3. **Tester avec le rôle manager** :
   ```bash
   # Devrait fonctionner
   curl -X GET "http://localhost:3000/reservations/future" \
     -H "Authorization: Bearer TOKEN_MANAGER"
   
   # Devrait échouer avec 403 Forbidden
   curl -X GET "http://localhost:3000/reservations" \
     -H "Authorization: Bearer TOKEN_MANAGER"
   ```

### Dépannage

**Problème : Erreur 401 Unauthorized**
- Vérifiez que le token est valide et non expiré
- Vérifiez que `KEYCLOAK_URL`, `KEYCLOAK_REALM` et `KEYCLOAK_CLIENT_ID` sont correctement configurés

**Problème : Erreur 403 Forbidden**
- Vérifiez que l'utilisateur a le rôle requis assigné dans Keycloak
- Vérifiez que le mapper de rôles est configuré dans le client Keycloak
- Vérifiez que les rôles sont bien inclus dans le token JWT

**Problème : Les rôles ne sont pas dans le token**
- Vérifiez la configuration du mapper dans le client Keycloak
- Assurez-vous que "Add to access token" est activé
- Vérifiez que les rôles sont assignés au niveau du realm, pas du client

## 🏃 Démarrage

```bash
# Mode développement (avec watch)
npm run start:dev

# Mode production
npm run start:prod

# Build
npm run build
```

## 🐳 Docker

### Construire l'image

```bash
# Depuis le répertoire back-api
docker build -t ars-back-api:latest .
```

### Lancer le conteneur

```bash
# Lancer le conteneur avec les variables d'environnement
docker run -d \
  --name ars-back-api \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/airbnb-reservations \
  -e PORT=3000 \
  ars-back-api:latest
```

### Lancer avec un fichier .env

```bash
# Lancer le conteneur en utilisant un fichier .env
docker run -d \
  --name ars-back-api \
  -p 3000:3000 \
  --env-file .env \
  ars-back-api:latest
```

### Commandes utiles

```bash
# Voir les logs
docker logs ars-back-api

# Suivre les logs en temps réel
docker logs -f ars-back-api

# Arrêter le conteneur
docker stop ars-back-api

# Redémarrer le conteneur
docker restart ars-back-api

# Supprimer le conteneur
docker rm ars-back-api
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
- `GET /reservations` : Liste toutes les réservations (rôle: `admin`)
- `GET /reservations/future` : Récupère les réservations à venir (rôle: `manager`)
- `GET /reservations/:id` : Récupère une réservation par ID (rôle: `admin`)
- `POST /reservations` : Crée une nouvelle réservation (rôle: `admin`)
- `PUT /reservations/:id` : Met à jour une réservation (rôle: `admin`)
- `DELETE /reservations/:id` : Supprime une réservation (rôle: `admin`)
- `GET /reservations/user/:userId` : Récupère les réservations d'un utilisateur (rôle: `admin`)
- `GET /reservations/property/:propertyId` : Récupère les réservations d'une propriété (rôle: `admin`)
- `GET /reservations/date-range/start/:startDate/end/:endDate` : Récupère les réservations dans une plage de dates (rôle: `admin`)

### Annonces (`/annonces`)

Gestion des annonces avec association de calendriers par ID.

**Endpoints principaux :**
- `GET /annonces` : Liste toutes les annonces (avec calendriers associés) (rôle: `admin`)
- `GET /annonces/:id` : Récupère une annonce par ID (avec calendriers associés) (rôle: `admin`)
- `POST /annonces` : Crée une nouvelle annonce (rôle: `admin`)
- `PUT /annonces/:id` : Met à jour une annonce (rôle: `admin`)
- `DELETE /annonces/:id` : Supprime une annonce (rôle: `admin`)

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
- `GET /calendar-urls` : Liste toutes les URLs de calendrier (rôle: `admin`)
- `GET /calendar-urls/:id` : Récupère une URL de calendrier par ID (rôle: `admin`)
- `POST /calendar-urls` : Crée une nouvelle URL de calendrier (rôle: `admin`)
- `PUT /calendar-urls/:id` : Met à jour une URL de calendrier (rôle: `admin`)
- `DELETE /calendar-urls/:id` : Supprime une URL de calendrier (rôle: `admin`)

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
| `KEYCLOAK_URL` | URL de base de Keycloak | `https://gul-si.fr/` | `https://gul-si.fr/` |
| `KEYCLOAK_REALM` | Nom du realm Keycloak | `gsi-booking` | `gsi-booking` |
| `KEYCLOAK_CLIENT_ID` | ID du client Keycloak | `app-admin` | `app-admin` |
| `KEYCLOAK_SECRET` | Secret du client Keycloak (optionnel pour les clients publics) | - | - |
| `CORS_ORIGIN` | Origines autorisées pour CORS (séparées par des virgules) | `http://localhost:3001` | `http://localhost:3001` |
| `EMAIL_SYNC_CRON` | Expression cron pour la synchronisation automatique des emails Airbnb | `0 */6 * * *` (toutes les 6 heures) | `0 */6 * * *` |
| `EMAIL_USER` | Adresse email pour la connexion IMAP | `user@example.com` | - |
| `EMAIL_PASSWORD` | Mot de passe de l'adresse email | `password123` | - |
| `EMAIL_HOST` | Serveur IMAP | `imap.gmail.com` | `imap.gmail.com` |
| `EMAIL_PORT` | Port IMAP | `993` | `993` |
| `EMAIL_TLS` | Activer TLS pour IMAP | `true` | `true` |
| `EVENT_PROCESSOR_CRON` | Expression cron pour le traitement automatique des événements | `*/5 * * * *` (toutes les 5 minutes) | `*/5 * * * *` |

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
