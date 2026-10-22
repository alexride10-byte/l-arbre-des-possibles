# Déployer Enfance+ sur Render (site + serveur) depuis GitHub

Architecture : **site web (React/Vite) + serveur (FastAPI) sur Render**, **base de données sur MongoDB Atlas**.
Le fichier `render.yaml` à la racine crée les deux services en une fois.

- `https://<votre-site>.onrender.com/` → accueil manga et connexion à l'espace professionnel
- **Premier lancement** : un écran « Installation d'Enfance+ » vous demande de créer le compte administrateur (e-mail + mot de passe). Vous pouvez cocher « Ajouter les données de démonstration ». Cet écran disparaît ensuite définitivement.

## 0. Envoyer le code sur GitHub
Dans Emergent : bouton **Save** → **Save to GitHub** → choisissez le dépôt et la branche.

## 1. Base de données — MongoDB Atlas (gratuit)
1. Créez un compte sur https://www.mongodb.com/cloud/atlas et un cluster **M0 (gratuit)**.
2. *Database Access* : créez un utilisateur + mot de passe.
3. *Network Access* : ajoutez `0.0.0.0/0`.
4. *Connect → Drivers* : copiez l'adresse `mongodb+srv://...` → ce sera **MONGO_URL**.

## 2. Render — Blueprint
1. https://render.com → **New → Blueprint** → sélectionnez votre dépôt GitHub.
2. Render détecte deux services : `enfance-plus-api` (serveur) et `enfance-plus` (site). Remplissez :

| Service | Variable | Valeur |
|---|---|---|
| enfance-plus-api | `MONGO_URL` | l'adresse copiée sur Atlas |
| enfance-plus-api | `CORS_ORIGINS` | l'adresse du site, ex. `https://enfance-plus.onrender.com` |
| enfance-plus-api | `EMERGENT_LLM_KEY` | votre clé universelle Emergent (Profil → Universal Key) pour l'IA de l'espace pro |
| enfance-plus | `REACT_APP_BACKEND_URL` | l'adresse du serveur, ex. `https://enfance-plus-api.onrender.com` (sans `/` final) |

3. Cliquez **Apply**. Test du serveur : `https://enfance-plus-api.onrender.com/api/` doit répondre.
4. Si vous changez `REACT_APP_BACKEND_URL` après coup, relancez le site : **Manual Deploy → Clear build cache & deploy**.

Chaque `git push` sur GitHub redéploie automatiquement les deux services.

## 3. Installer l'application
- **Ordinateur (Chrome / Edge)** : icône « Installer » dans la barre d'adresse (ou bouton ⬇ dans l'espace pro).
- **Android** : menu ⋮ → « Installer l'application ».
- **iPhone / iPad** : Safari → Partager → « Sur l'écran d'accueil ».

## Bon à savoir
- L'offre gratuite de Render met le serveur en veille : la première ouverture de l'espace pro peut prendre ~30 s. Le launcher, lui, s'affiche immédiatement (il n'utilise pas le serveur).
- `EMAIL_MODE=simulated` : les e-mails de vérification sont simulés.
- Les données de l'aperçu Emergent ne sont pas copiées : la nouvelle base démarre avec les comptes de démonstration.

## Modifier les données du launcher
Tout est dans `frontend/src/launcher/data/launcher.ts` (domaines, sous-branches, racines, capacités, fragilités, liens, profil fictif). La scène (`launcher/scene/`), les interactions (`launcher/logic/`, `launcher/state/`) et l'interface (`launcher/ui/`) sont séparées.
