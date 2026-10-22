# Publier Enfance+ sur Render (depuis un téléphone)

## Ce que contient le projet
| Partie | Dossier | Fichier clé |
|---|---|---|
| Serveur (FastAPI) | `backend/` | `backend/requirements.txt`, `backend/server.py` |
| Site (React/Vite) | `frontend/` | `frontend/package.json`, `frontend/yarn.lock` |
| Configuration Render | racine | `render.yaml` (crée les 2 services) |

Les commandes de `render.yaml` partent de la **racine du dépôt** :
- Serveur : `pip install -r backend/requirements.txt`, puis `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
- Site : `cd frontend && yarn install && yarn build` → publie `frontend/build`

## Étape 1 — Envoyer la dernière version sur GitHub
Dans Emergent : **Save → Save to GitHub** (même dépôt, même branche que Render).
Vérification sur le téléphone : ouvrez votre dépôt sur github.com. Vous devez voir `render.yaml`, `backend/requirements.txt` et `frontend/yarn.lock`.

## Étape 2 — Base de données MongoDB Atlas (gratuite)
1. mongodb.com/cloud/atlas → créer un cluster **M0**.
2. *Database Access* → ajouter un utilisateur + mot de passe.
3. *Network Access* → ajouter `0.0.0.0/0`.
4. *Connect → Drivers* → copier l'adresse `mongodb+srv://…`.

## Étape 3 — Render
1. **Si un ancien service a échoué** : ouvrez-le → *Settings* → tout en bas, **Delete**. Supprimez aussi l'ancien Blueprint.
2. **New → Blueprint** → choisissez le dépôt → Render lit `render.yaml`.
3. Remplissez les cases demandées :

| Service | Variable | Quoi mettre |
|---|---|---|
| enfance-plus-api | `MONGO_URL` | l'adresse Atlas copiée |
| enfance-plus-api | `CORS_ORIGINS` | `https://enfance-plus.onrender.com` (l'adresse du site) |
| enfance-plus-api | `EMERGENT_LLM_KEY` | votre clé universelle Emergent (Profil → Universal Key) |
| enfance-plus | `REACT_APP_BACKEND_URL` | `https://enfance-plus-api.onrender.com` (sans `/` à la fin) |

Les autres réglages (`DB_NAME`, `AUTH_ENABLED`, `EMAIL_MODE`, `SEED_DEMO`, `CORS_ORIGIN_REGEX`, Python 3.11, Node 20) sont déjà remplis.

4. **Apply**. Attendez que les 2 services soient « Live » (5 à 10 min).
5. Si Render vous a donné d'autres adresses que celles du tableau, corrigez `CORS_ORIGINS` et `REACT_APP_BACKEND_URL`, puis sur le site : **Manual Deploy → Clear build cache & deploy**.

## Étape 4 — Premier lancement
- Test du serveur : `https://enfance-plus-api.onrender.com/api/` doit afficher `{"app":"Enfance+","status":"ok"}`.
- Ouvrez le site → écran **« Installation d'Enfance+ »** → créez votre compte administrateur (cochez les données de démo si vous le voulez). Cet écran n'apparaît qu'une fois.
- Installer l'appli : Android → menu ⋮ → « Installer l'application » ; iPhone → Safari → Partager → « Sur l'écran d'accueil ».

## Bon à savoir
- Offre gratuite : le serveur s'endort après 15 min sans visite ; la première ouverture prend ~30 s.
- Les e-mails sont simulés (`EMAIL_MODE=simulated`).
- Les fichiers `.env` ne partent jamais sur GitHub : les secrets se saisissent uniquement dans Render.
- Chaque nouveau « Save to GitHub » redéploie automatiquement.
