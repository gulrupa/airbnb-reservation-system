# Documentation API - Airbnb Reservation System

## Accès à la documentation Swagger

Une fois l'application démarrée, la documentation Swagger est accessible à l'adresse :

```
http://localhost:3000/api
```

## Structure de la documentation

La documentation OpenAPI/Swagger inclut :

### Tags

- **reservations** : Gestion des réservations
- **calendar-urls** : Gestion des URLs de calendrier
- **airbnb** : Intégration avec les calendriers Airbnb

## Endpoints

### Réservations (`/reservations`)

#### `GET /reservations`
Récupérer toutes les réservations.

**Réponse** : Liste de toutes les réservations

#### `GET /reservations/:id`
Récupérer une réservation par ID.

**Paramètres** :
- `id` (string) : ID de la réservation

**Réponse** : Détails de la réservation

#### `POST /reservations`
Créer une nouvelle réservation.

**Body** :
```json
{
  "externalId": "HMPSS2HE58",
  "price": 150.5,
  "startDate": "2025-12-21",
  "endDate": "2025-12-22",
  "numberOfTravelers": 2
}
```

**Réponse** : Réservation créée

#### `PUT /reservations/:id`
Mettre à jour une réservation.

**Paramètres** :
- `id` (string) : ID de la réservation

**Body** : Tous les champs sont optionnels
```json
{
  "price": 200.0,
  "numberOfTravelers": 3
}
```

**Réponse** : Réservation mise à jour

#### `DELETE /reservations/:id`
Supprimer une réservation.

**Paramètres** :
- `id` (string) : ID de la réservation

**Réponse** : 204 No Content

#### `GET /reservations/user/:userId`
Récupérer les réservations d'un utilisateur.

**Paramètres** :
- `userId` (string) : ID de l'utilisateur

**Réponse** : Liste des réservations de l'utilisateur

#### `GET /reservations/property/:propertyId`
Récupérer les réservations d'une propriété.

**Paramètres** :
- `propertyId` (string) : ID de la propriété

**Réponse** : Liste des réservations de la propriété

#### `GET /reservations/date-range/start/:startDate/end/:endDate`
Récupérer les réservations dans une plage de dates.

**Paramètres** :
- `startDate` (string) : Date de début (format: YYYY-MM-DD)
- `endDate` (string) : Date de fin (format: YYYY-MM-DD)

**Réponse** : Liste des réservations dans la plage de dates

#### `GET /reservations/airbnb/calendar?url=...`
Récupérer les réservations depuis un calendrier Airbnb.

**Query Parameters** :
- `url` (string, requis) : URL du calendrier iCal Airbnb

**Exemple** :
```
GET /reservations/airbnb/calendar?url=https://www.airbnb.fr/calendar/ical/123456789.ics?t=token
```

**Réponse** : Liste des réservations extraites du calendrier

### URLs de calendrier (`/calendar-urls`)

#### `GET /calendar-urls`
Récupérer toutes les URLs de calendrier.

**Query Parameters** (optionnel) :
- `platform` (string) : Filtrer par plateforme (`airbnb`, `booking`, `other`)

**Réponse** : Liste de toutes les URLs

#### `GET /calendar-urls/active`
Récupérer uniquement les URLs actives.

**Réponse** : Liste des URLs actives

#### `GET /calendar-urls/:id`
Récupérer une URL par ID.

**Paramètres** :
- `id` (string) : ID de l'URL

**Réponse** : Détails de l'URL

#### `POST /calendar-urls`
Créer une nouvelle URL de calendrier.

**Body** :
```json
{
  "url": "https://www.airbnb.fr/calendar/ical/123456789.ics?t=token",
  "name": "Mon calendrier Airbnb",
  "description": "Calendrier pour la propriété de Paris",
  "platform": "airbnb",
  "isActive": true
}
```

**Réponse** : URL créée

#### `PUT /calendar-urls/:id`
Mettre à jour une URL de calendrier.

**Paramètres** :
- `id` (string) : ID de l'URL

**Body** : Tous les champs sont optionnels

**Réponse** : URL mise à jour

#### `DELETE /calendar-urls/:id`
Supprimer une URL de calendrier.

**Paramètres** :
- `id` (string) : ID de l'URL

**Réponse** : 204 No Content

## Formats de données

### Dates

Les dates acceptent deux formats :

1. **Format simple** : `YYYY-MM-DD` (ex: `2025-12-21`)
2. **Format ISO 8601** : `2025-12-21T00:00:00.000Z`

Les dates au format simple sont automatiquement converties en objets `Date` avec l'heure à minuit UTC.

### Exemples de requêtes

#### Créer une réservation avec date simple
```json
{
  "externalId": "HMPSS2HE58",
  "price": 150.5,
  "startDate": "2025-12-21",
  "endDate": "2025-12-22",
  "numberOfTravelers": 2
}
```

#### Créer une réservation avec date ISO 8601
```json
{
  "externalId": "HMPSS2HE58",
  "price": 150.5,
  "startDate": "2025-12-21T00:00:00.000Z",
  "endDate": "2025-12-22T00:00:00.000Z",
  "numberOfTravelers": 2
}
```

## Codes de statut HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 204 | Succès sans contenu |
| 400 | Requête invalide |
| 404 | Ressource non trouvée |
| 409 | Conflit (ressource existe déjà) |
| 500 | Erreur serveur |

## Gestion des erreurs

Toutes les erreurs retournent un format standardisé :

```json
{
  "statusCode": 400,
  "timestamp": "2025-12-21T18:27:45.735Z",
  "path": "/reservations",
  "method": "POST",
  "message": [
    "startDate must be a valid date string",
    "price must be a positive number"
  ]
}
```

## Export du schéma OpenAPI

Pour exporter le schéma OpenAPI en JSON :

```bash
curl http://localhost:3000/api-json > openapi.json
```

Pour exporter en YAML :

```bash
curl http://localhost:3000/api-yaml > openapi.yaml
```

## Utilisation

1. Démarrer l'application :
   ```bash
   npm run start:dev
   ```

2. Accéder à la documentation :
   Ouvrir `http://localhost:3000/api` dans votre navigateur

3. Tester les endpoints :
   Utiliser l'interface Swagger UI pour tester directement les endpoints

## Logging

Toutes les requêtes et erreurs sont loggées automatiquement. Les logs incluent :
- Méthode HTTP et URL
- Paramètres de la requête (body, query, params)
- Temps de traitement
- Stack trace complète en cas d'erreur
