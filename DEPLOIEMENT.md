# Mettre Enfance+ en ligne gratuitement (Render + MongoDB Atlas + Gemini)

## L'appli en 3 morceaux
| Morceau | Dossier | Hébergé sur |
|---|---|---|
| Le site (React) | `frontend/` | Render « Static Site » (gratuit) |
| Le serveur (Python/FastAPI) | `backend/` | Render « Web Service » (gratuit) |
| La base de données (MongoDB) | — | MongoDB Atlas M0 (gratuit) |
| L'IA | `backend/ai.py` | Google Gemini (clé gratuite) |

`render.yaml` décrit les deux services Render : il faut passer par **New → Blueprint**, pas par « New → Web Service ».

## 1. Base de données MongoDB Atlas
1. https://www.mongodb.com/cloud/atlas/register → créer un cluster **M0 (Free)**, région Europe (Frankfurt).
2. *Database Access* → ajouter un utilisateur avec un mot de passe **sans caractères spéciaux** (lettres + chiffres).
3. *Network Access* → `0.0.0.0/0` (Render n'a pas d'adresse IP fixe en gratuit).
4. *Connect → Drivers* → copier l'adresse `mongodb+srv://…` et y remplacer `<db_password>` par le mot de passe.

## 2. Clé IA Gemini
https://aistudio.google.com/apikey → **Create API key** → copier la clé (`AIza…`).
Sans clé, l'appli fonctionne quand même ; seules les fonctions IA affichent un message.
La génération d'images (avatars, arbre peint) peut ne pas être incluse dans l'offre gratuite de Gemini.

## 3. Render
1. https://dashboard.render.com → **New → Blueprint** → choisir le dépôt `l-arbre-des-possibles`.
2. Remplir :

| Service | Variable | Valeur |
|---|---|---|
| enfance-plus-api | `MONGO_URL` | l'adresse Atlas |
| enfance-plus-api | `CORS_ORIGINS` | l'adresse du site, ex. `https://enfance-plus.onrender.com` |
| enfance-plus-api | `GEMINI_API_KEY` | la clé Gemini |
| enfance-plus | `REACT_APP_BACKEND_URL` | l'adresse du serveur, ex. `https://enfance-plus-api.onrender.com` |

3. **Apply**. Si Render donne d'autres adresses que celles ci-dessus, corriger les deux variables d'adresse puis
   sur le site : **Manual Deploy → Clear build cache & deploy**.

## 4. Premier lancement
- Test du serveur : `https://<serveur>.onrender.com/api/` → `{"app":"Enfance+","status":"ok",…}`.
- Ouvrir le site **tout de suite** → écran « Installation d'Enfance+ » → créer le compte administrateur
  (la première personne qui ouvre le site devient administrateur).
- Téléphone : Android → Chrome → menu ⋮ → « Installer l'application ». iPhone → Safari → Partager → « Sur l'écran d'accueil ».

## Fonctionnement des comptes (sans e-mail)
- Une personne crée son compte → il reste **en attente** → l'administrateur le valide et choisit son rôle (Administration).
- Mot de passe oublié → l'administrateur clique **« Mot de passe »** sur la fiche de la personne : un lien valable 24 h
  est créé (et copié) ; il le lui transmet (SMS, messagerie…).

## Bon à savoir
- Offre gratuite : le serveur s'endort après 15 min sans visite ; l'appli affiche « Réveil du serveur » (jusqu'à 1 min).
- Chaque envoi sur GitHub redéploie automatiquement, et GitHub lance la vérification (onglet **Actions**).
- Aucun secret dans GitHub : les clés se saisissent uniquement dans Render.
