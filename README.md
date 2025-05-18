# NyanGPT - Application de Chat en Temps Réel

NyanGPT est une application de chat en temps réel développée avec NestJS et React.

![NyanGPT](./client/public/nyan-cat.gif)

## Fonctionnalités

- Inscription et connexion des utilisateurs
- Personnalisation du nom d'utilisateur avec le choix de couleurs
- Création et gestion de salles de discussion
- Chat en temps réel avec WebSockets

## Prérequis

- [Docker](https://www.docker.com/get-started) et Docker Compose
- [Node.js](https://nodejs.org/) et npm
- [Git](https://git-scm.com/)

## Structure du projet

Le projet est organisé en deux parties principales :

- `server/` : Back NestJS
- `client/` : Front React

## Installation et démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/LlamasScripters/nyangpt.git
cd nyangpt
```

### 2. Configuration des fichiers d'environnement

#### Pour le back :

Copiez le fichier d'exemple et configurez-le:

```bash
cp server/.env.example server/.env
```

Exemple de config pour le serveur:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/nyangpt
PG_USERNAME=postgres
PGPASSWORD=postgres
JWT_SECRET=nestchat_secret_key
PORT=3000
NODE_ENV=development
```

#### Pour le client:

Copiez le fichier d'exemple et configurez-le:

```bash
cp client/.env.dist client/.env
```

### 3. Démarrage avec Docker Compose

Construisez et démarrez les conteneurs:

```bash
docker compose up --build -d
```

Ce processus va :
- Construire les images Docker pour le client et le serveur
- Démarrer la base de données PostgreSQL
- Lancer le serveur NestJS sur le port 3000
- Lancer le client React sur le port 5173

### 4. Migrations de base de données

Une fois les conteneurs démarrés, exécutez les migrations Drizzle:

```bash
docker exec -it nyangpt-api npm run db:migrate:dev
```

Sinon :

```bash
docker exec -it nyangpt-api sh

# Dans le conteneur
npm run db:generate:dev
npm run db:migrate:dev
```

### 5. Accès à l'application

- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:3000

## Développement local sans Docker

### NestJS

```bash
cd server
npm install

# configurez votre base de données PostgreSQL locale dans le .env
npm run db:generate:dev
npm run db:migrate:dev
npm run start:dev
```

### React

```bash
cd client
npm install
npm run dev
```
