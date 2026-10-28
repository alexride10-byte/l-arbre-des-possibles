# Enfance+ · L'Arbre des Possibles

Appli d'accompagnement éducatif : chaque enfant suivi est représenté par un arbre de vie (7 domaines),
avec observations, quêtes, notes, calendrier partagé, messagerie et assistant IA.

## Structure

```
frontend/            React 19 + Vite + Tailwind (site statique, installable sur téléphone)
backend/             API FastAPI + MongoDB
  server.py          point d'entrée : app, en-têtes de sécurité, CORS
  core.py            connexion MongoDB, constantes, audit
  auth.py            comptes, sessions, rôles (dépendances User / Admin / role(...))
  children.py        dossiers enfants + droits d'accès (dépendances Access / Owner)
  assistant.py       fonctions IA (quêtes, assistant, avatars, arbre peint)
  ai.py              client Google Gemini
  messages.py        messagerie
  calendar_routes.py calendrier + rappels
  admin.py           administration + contenus modifiables
  install.py         première installation, données de démo, index
  tests/             tests de bout en bout (lancés par GitHub Actions)
render.yaml          déploiement Render (Blueprint)
```

## Rôles
`admin` (tout), `direction` (lecture seule de tous les dossiers), `educator` (ses dossiers, ceux qui lui sont attribués ou partagés),
`internal` (statistiques uniquement). Les nouveaux comptes restent en attente jusqu'à validation par un admin.

## Lancer en local

```bash
# Serveur (MongoDB local ou Atlas)
cd backend && pip install -r requirements.txt
MONGO_URL=mongodb://localhost:27017 CORS_ORIGINS=http://localhost:3000 uvicorn server:app --reload --port 8001

# Site
cd frontend && yarn install
REACT_APP_BACKEND_URL=http://localhost:8001 yarn start
```

Variables du serveur : `MONGO_URL` (obligatoire), `CORS_ORIGINS`, `GEMINI_API_KEY` (optionnelle), `DB_NAME`.

## Tests
`ruff check backend` puis, serveur lancé : `API_URL=http://localhost:8001 pytest backend/tests` (base vide).
GitHub Actions lance tout à chaque envoi (onglet **Actions**).

## Mise en ligne
Voir [DEPLOIEMENT.md](DEPLOIEMENT.md) (Render + MongoDB Atlas + Gemini, tout gratuit).
