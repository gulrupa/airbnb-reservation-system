# App Admin - Airbnb Reservation System

Application d'administration Next.js pour la gestion des réservations et calendriers Airbnb.

## 🚀 Fonctionnalités

- **Authentification Keycloak** : Connexion/déconnexion sécurisée avec gestion automatique des tokens
- **Gestion des calendriers** : CRUD complet pour les calendriers iCal
  - Liste de tous les calendriers avec leurs informations
  - Création de nouveaux calendriers
  - Modification des calendriers existants
  - Suppression de calendriers
  - Synchronisation manuelle des calendriers avec l'API externe
- **Visualisation des réservations** : Affichage des réservations associées à chaque calendrier
  - Liste détaillée des réservations
  - Informations complètes (dates, prix, voyageurs, type)
  - Formatage des dates en français
- **Interface moderne** : Utilise HeroUI pour l'interface utilisateur avec support du thème sombre

## 📋 Prérequis

- Node.js 20+
- Keycloak configuré et accessible

## 🔧 Installation

```bash
# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Configurer les variables d'environnement dans .env
```

## 🔧 Configuration

Les variables d'environnement suivantes doivent être configurées dans le fichier `.env` :

```env
# Configuration Keycloak
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=airbnb-reservation
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=app-admin

# Configuration API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Configuration serveur
PORT=3001
```

| Variable | Description | Exemple | Défaut |
|----------|-------------|---------|--------|
| `NEXT_PUBLIC_KEYCLOAK_URL` | URL du serveur Keycloak | `http://localhost:8080` | `http://localhost:8080` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Realm Keycloak | `airbnb-reservation` | `airbnb-reservation` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | ID du client Keycloak | `app-admin` | `app-admin` |
| `NEXT_PUBLIC_API_URL` | URL de l'API backend | `http://localhost:3000` | `http://localhost:3000` |
| `PORT` | Port d'écoute de l'application | `3001` | `3001` |

## 🏃 Démarrage

```bash
# Mode développement
npm run dev
```

L'application sera accessible sur http://localhost:3001 (ou le port configuré dans `PORT`)

**Note :** Le port peut être configuré de deux façons :
- Via la variable d'environnement `PORT` dans le fichier `.env` (recommandé) - le script lit automatiquement cette valeur
- Directement en ligne de commande : `PORT=3002 npm run dev` ou `npm run dev -- -p 3002`

Les scripts `dev` et `start` lisent automatiquement le port depuis le fichier `.env`. Si `PORT` n'est pas défini, le port par défaut est `3001`.

```bash
# Mode production
npm run build
npm start
```

**Note :** En production, le port peut être configuré via la variable `PORT` dans `.env` ou avec `PORT=3002 npm start` ou `npm start -- -p 3002`

## 🐳 Docker

### Construire l'image

```bash
# Depuis le répertoire app-admin
docker build -t ars-app-admin:latest .
```

### Lancer le conteneur

```bash
# Lancer le conteneur avec les variables d'environnement
docker run -d \
  --name ars-app-admin \
  -p 4200:4200 \
  -e NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_KEYCLOAK_REALM=airbnb-reservation \
  -e NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=app-admin \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  -e PORT=4200 \
  ars-app-admin:latest
```

### Lancer avec un fichier .env

```bash
# Lancer le conteneur en utilisant un fichier .env
docker run -d \
  --name ars-app-admin \
  -p 4200:4200 \
  --env-file .env \
  ars-app-admin:latest
```

### Commandes utiles

```bash
# Voir les logs
docker logs ars-app-admin

# Suivre les logs en temps réel
docker logs -f ars-app-admin

# Arrêter le conteneur
docker stop ars-app-admin

# Redémarrer le conteneur
docker restart ars-app-admin

# Supprimer le conteneur
docker rm ars-app-admin
```

## 🔐 Configuration Keycloak

### Créer le client dans Keycloak

1. Accéder à http://localhost:8080/admin
2. Sélectionner le realm `airbnb-reservation`
3. Créer un nouveau client :
   - **Client ID** : `app-admin`
   - **Client Protocol** : `openid-connect`
   - **Access Type** : `public`
   - **Valid Redirect URIs** : `http://localhost:3001/*` (ou le port configuré)
   - **Web Origins** : `http://localhost:3001` (ou le port configuré)

## 📁 Structure

```
app-admin/
├── app/
│   ├── calendars/                    # Pages de gestion des calendriers
│   │   ├── page.tsx                  # Liste et gestion des calendriers
│   │   └── [id]/
│   │       └── reservations/
│   │           └── page.tsx          # Réservations d'un calendrier
│   ├── login/                        # Page de connexion
│   ├── page.tsx                      # Page d'accueil
│   ├── layout.tsx                    # Layout principal
│   └── providers.tsx                 # Providers (thème, auth)
├── components/
│   ├── navbar.tsx                    # Barre de navigation
│   └── ...                           # Autres composants UI
├── contexts/
│   └── AuthContext.tsx               # Contexte d'authentification Keycloak
├── lib/
│   ├── api.ts                        # Service API générique avec authentification
│   ├── calendar-api.ts               # Service API spécialisé pour les calendriers
│   └── keycloak.ts                   # Configuration Keycloak
└── types/
    └── calendar.ts                   # Types TypeScript pour calendriers et réservations
```

## 📚 Pages disponibles

### Page d'accueil (`/`)
Tableau de bord principal avec informations de connexion.

### Gestion des calendriers (`/calendars`)
Page principale pour la gestion des calendriers :
- **Liste des calendriers** : Tableau avec toutes les informations (nom, URL, plateforme, statut)
- **Création** : Modal pour ajouter un nouveau calendrier
- **Modification** : Modal pour modifier un calendrier existant
- **Suppression** : Suppression avec confirmation
- **Synchronisation** : Bouton pour synchroniser un calendrier avec l'API externe
- **Voir réservations** : Lien vers la page des réservations du calendrier

### Réservations d'un calendrier (`/calendars/[id]/reservations`)
Page affichant les réservations associées à un calendrier :
- **Informations du calendrier** : Détails du calendrier sélectionné
- **Liste des réservations** : Tableau avec toutes les réservations
  - ID externe
  - Dates de début et fin (format français)
  - Prix (format EUR)
  - Nombre de voyageurs
  - Type (réservation ou blocage manuel)

## 🔌 API Backend

L'application communique avec l'API backend NestJS. Assurez-vous que :
- L'API backend est démarrée et accessible à l'URL configurée dans `NEXT_PUBLIC_API_URL`
- L'API backend expose les endpoints suivants :
  - `GET /calendar-urls` : Liste des calendriers
  - `GET /calendar-urls/:id` : Détails d'un calendrier
  - `POST /calendar-urls` : Création d'un calendrier
  - `PUT /calendar-urls/:id` : Mise à jour d'un calendrier
  - `DELETE /calendar-urls/:id` : Suppression d'un calendrier
  - `POST /calendar-urls/:id/sync` : Synchronisation d'un calendrier
  - `GET /reservations/calendar/:calendarUrlId` : Réservations d'un calendrier

## 🛠️ Services API

### `lib/api.ts`
Service générique pour les requêtes HTTP :
- Gestion automatique de l'authentification Keycloak
- Ajout automatique du token Bearer dans les headers
- Gestion des erreurs HTTP
- Méthodes : `get`, `post`, `put`, `delete`

### `lib/calendar-api.ts`
Service spécialisé pour les calendriers :
- `getAll()` : Récupère tous les calendriers
- `getById(id)` : Récupère un calendrier par ID
- `create(data)` : Crée un nouveau calendrier
- `update(id, data)` : Met à jour un calendrier
- `delete(id)` : Supprime un calendrier
- `sync(id)` : Synchronise un calendrier
- `getReservations(calendarUrlId)` : Récupère les réservations d'un calendrier

## 🐛 Dépannage

### Problème de connexion Keycloak

Vérifiez que :
- Keycloak est démarré et accessible
- Le realm `airbnb-reservation` existe
- Le client `app-admin` est configuré correctement
- Les URLs de redirection sont correctes

### Erreur CORS

Assurez-vous que `Web Origins` est configuré dans Keycloak avec `http://localhost:3001` (ou le port configuré dans `PORT`)

### Erreur de connexion à l'API

Vérifiez que :
- L'API backend est démarrée et accessible
- L'URL dans `NEXT_PUBLIC_API_URL` est correcte
- L'API backend accepte les requêtes depuis `http://localhost:3001` (ou le port configuré dans `PORT`)

### Erreur lors de la synchronisation

Assurez-vous que :
- L'URL du calendrier est valide et accessible
- La plateforme est correctement configurée (airbnb, booking, etc.)
- L'API backend peut accéder à l'URL du calendrier iCal
