# Déployer Enfance+ depuis GitHub

Architecture : **site web (React/Vite) sur Vercel** + **serveur (FastAPI) sur Render** + **base de données sur MongoDB Atlas**.
Une fois en ligne, le site s'installe comme un logiciel sur ordinateur et comme une application sur téléphone (bouton ⬇ en haut à droite).

## 0. Envoyer le code sur GitHub
Dans Emergent : bouton **Save** → **Save to GitHub** → choisissez le dépôt et la branche.

## 1. Base de données — MongoDB Atlas (gratuit)
1. Créez un compte sur https://www.mongodb.com/cloud/atlas et un cluster **M0 (gratuit)**.
2. *Database Access* : créez un utilisateur + mot de passe.
3. *Network Access* : ajoutez `0.0.0.0/0`.
4. *Connect → Drivers* : copiez l'adresse `mongodb+srv://...` → ce sera **MONGO_URL**.

## 2. Serveur — Render
1. https://render.com → **New → Blueprint** → sélectionnez votre dépôt GitHub (le fichier `render.yaml` est détecté).
2. Remplissez les variables demandées :

| Variable | Valeur |
|---|---|
| `MONGO_URL` | l'adresse copiée sur Atlas |
| `DB_NAME` | `enfance_plus` |
| `CORS_ORIGINS` | l'adresse de votre site Vercel (ex. `https://enfance-plus.vercel.app`) — à compléter après l'étape 3 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | le compte administrateur créé au démarrage |
| `EMERGENT_LLM_KEY` | votre clé universelle Emergent (Profil → Universal Key) pour l'IA et les avatars |

3. Déployez. Notez l'adresse obtenue, ex. `https://enfance-plus-api.onrender.com`.
   Test : ouvrez `https://enfance-plus-api.onrender.com/api/` dans le navigateur.

## 3. Site web — Vercel
1. https://vercel.com → **Add New → Project** → importez le dépôt GitHub.
2. **Root Directory** : `frontend` (le fichier `vercel.json` règle la compilation).
3. Variable d'environnement : `REACT_APP_BACKEND_URL` = l'adresse Render (sans `/api` ni `/` final).
4. **Deploy**. Revenez sur Render pour mettre l'adresse Vercel dans `CORS_ORIGINS`, puis redéployez le serveur.

## 4. Installer l'application
- **Ordinateur (Chrome / Edge)** : icône « Installer » dans la barre d'adresse, ou bouton ⬇ dans Enfance+.
- **Android** : menu ⋮ → « Installer l'application ».
- **iPhone / iPad** : Safari → Partager → « Sur l'écran d'accueil ».

Chaque `git push` sur GitHub redéploie automatiquement Vercel et Render.

## Bon à savoir
- L'offre gratuite de Render met le serveur en veille : la première ouverture peut prendre ~30 s.
- `EMAIL_MODE=simulated` : les e-mails de vérification sont simulés (aucun vrai e-mail n'est envoyé).
- Les données de l'aperçu Emergent ne sont pas copiées : la nouvelle base démarre avec les comptes de démonstration.
