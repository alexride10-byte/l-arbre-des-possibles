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
| enfance-plus-api | `APP_URL` | `https://enfance-plus.onrender.com` (l'adresse du site, pour les liens des e-mails) |
| enfance-plus-api | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | les identifiants SMTP de votre service d'e-mails (Brevo, Resend, Mailjet…) |
| enfance-plus-api | `EMAIL_FROM` | l'expéditeur, par ex. `Enfance+ <no-reply@votre-domaine.fr>` |
| enfance-plus | `REACT_APP_BACKEND_URL` | `https://enfance-plus-api.onrender.com` (sans `/` à la fin) |

Les autres réglages (`DB_NAME`, `AUTH_ENABLED`, `EMAIL_MODE=smtp`, `SMTP_PORT=587`, `SEED_DEMO`, Python 3.11, Node 20) sont déjà remplis. `SETUP_CODE` est généré automatiquement par Render.

⚠️ Ne remettez pas `CORS_ORIGIN_REGEX` : n'importe quel site `*.onrender.com` pourrait alors lire les données de vos utilisateurs connectés. Seule l'adresse exacte du site doit figurer dans `CORS_ORIGINS`.

4. **Apply**. Attendez que les 2 services soient « Live » (5 à 10 min).
5. Si Render vous a donné d'autres adresses que celles du tableau, corrigez `CORS_ORIGINS` et `REACT_APP_BACKEND_URL`, puis sur le site : **Manual Deploy → Clear build cache & deploy**.

## Étape 4 — Premier lancement
- Test du serveur : `https://enfance-plus-api.onrender.com/api/` doit afficher `{"app":"Enfance+","status":"ok"}`.
- Dans Render, service **enfance-plus-api** → *Environment* → copiez la valeur de `SETUP_CODE`.
- Ouvrez le site → écran **« Installation d'Enfance+ »** → collez le code, puis créez votre compte administrateur. Cet écran n'apparaît qu'une fois.
- ⚠️ Ne cochez **pas** les données de démo pour une vraie structure : elles créent des comptes dont les mots de passe sont publics (dans le code).
- Installer l'appli : Android → menu ⋮ → « Installer l'application » ; iPhone → Safari → Partager → « Sur l'écran d'accueil ».

## Bon à savoir
- Offre gratuite : le serveur s'endort après 15 min sans visite ; la première ouverture prend ~30 s.
- Les e-mails (vérification, mot de passe oublié) partent par SMTP. `EMAIL_MODE=simulated` affiche les liens à l'écran : **uniquement en développement**, jamais en ligne (n'importe qui pourrait réinitialiser le mot de passe d'un autre).
- Pour partager un dossier avec une famille : le parent crée son compte, l'admin le valide avec le rôle **Parent** (lecture seule), puis le responsable du dossier le partage avec son adresse.
- Les fichiers `.env` ne partent jamais sur GitHub : les secrets se saisissent uniquement dans Render.
- Chaque nouveau « Save to GitHub » redéploie automatiquement.
