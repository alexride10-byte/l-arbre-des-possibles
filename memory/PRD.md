# Enfance+ — PRD

## Original request (FR)
Application psychologique sur le développement de l'enfant, style RPG (maquette image fournie), à partir de l'app Lovable existante (ne pas repartir de zéro). Choix : niveaux/XP/quêtes/badges, base de données serveur multi-profils, assistant IA (pistes + synthèses), auth Google (activable/désactivable, désactivée pour l'instant), public pros + parents.

## Architecture
- Frontend: /app/frontend — Vite + React 19 + TS + Tailwind v4 (reprend le code Lovable de /app/src : LifeTree SVG, data, panneaux). /app/src = code Lovable d'origine, intact.
- Backend: /app/backend/server.py — FastAPI + MongoDB (users, user_sessions, children, observations, ai_messages).
- Auth: Emergent Google OAuth, interrupteur `AUTH_ENABLED` (backend/.env). false = utilisateur « demo-user » automatique.
- IA: Claude Sonnet 5.5 via clé Emergent, SSE streaming, prompt éthique (pas de diagnostic, faits/hypothèses/pistes, 119).

## Implémenté (2026-10-20)
- Layout maquette : barre du haut, menu gauche (carte enfant, nav, filtres domaines, affichage), arbre central avec Vue actuelle/Simulation/Comparaison + niveau de détail, panneau détail (Niveau x/5, onglets Détails/Actions/Impacts/Ressources, facteurs associés, pistes), simulation de trajectoires (4 scénarios, 5 ans), aperçu du futur.
- RPG : niveaux par domaine, XP (+50 étape, +10 observation), niveau global, 7 badges, 8 quêtes.
- Pages : Profil (multi-profils, avatar), Compétences (radar), Chronologie, Interventions, Ressources (+ numéros utiles), Documents (synthèse/note famille/compte rendu IA, impression, téléchargement).
- Assistant IA en tiroir avec historique par enfant.

## Itération 2 (2026-10-20)
- Fix boucle de connexion Google : CORS (regex domaines Emergent) + jeton Bearer de secours (localStorage)
- IA locale (Ollama, appel direct navigateur -> localhost:11434, historique local) / Cloud (Claude) au choix dans Réglages
- Partage parent-pro par e-mail (rôle), accès collaboratif, actions destructives réservées au propriétaire, auteur des observations
- Quêtes générées par l'IA (cloud ou locale) sauvegardées dans child.custom_quests, suppression avec retrait de l'XP
- Carte de progrès imprimable (/carte)

## Itération 3 (2026-10-21) — DA manga + MVP auth/rôles
- DA manga : 17 illustrations IA (8 portraits, hero, login, 7 bannières domaines), écran de connexion, pages domaine (/domaine/:id), page futur (/futur), liste enfants (/enfants), activités illustrées, indicateur global /100, portrait dans l'arbre
- Auth : Google + e-mail/mot de passe (bcrypt), vérification e-mail & réinitialisation SIMULÉES (liens affichés), sessions révocables (/compte), anti brute-force (5 essais / 15 min par e-mail), interrupteur AUTH_ENABLED
- Rôles : admin structure, éducateur (dossiers attribués), direction (lecture seule), équipe interne (stats agrégées seulement), inscription en attente de validation, attribution des dossiers, journal des accès (/admin)
- Avatars : galerie, « Générer mon avatar » (Gemini Nano Banana), onglet Évolution

## Itération 4 (2026-10-21) — Messagerie sécurisée
- Fils privés entre professionnels (/messages), liés ou non au dossier d'un enfant ; accès re-vérifié à chaque lecture (participants + droit sur le dossier), journalisé (création, lecture, envoi) ; badge non-lus (polling 30 s), conversation rafraîchie toutes les 10 s ; fil de démo seedé

## Itération 5 (2026-10-21) — Arbre peint
- Fond de l'arbre = illustration manga peinte (arbre multicolore + enfant au pied), intégrée dans la caméra SVG (zoom), arbre vectoriel masqué (prop painted), médaillons/chips/défis interactifs par-dessus, fond flou latéral, contours de lisibilité

## Itération 6 (2026-10-21) — Arbre personnalisé + progression 12 mois
- POST /children/{id}/tree/generate : Nano Banana édite l'arbre de base avec le portrait de l'enfant (composition conservée), stockage db.avatars kind=tree (ancien supprimé, anti-spam 60 s), DELETE pour revenir à l'arbre de base ; bouton « Peindre l'arbre de … » dans l'en-tête de l'arbre
- Graphique « Progression par domaine » (12 mois, depuis level_history) à côté des trajectoires ; historique fictif seedé pour les enfants de démo

## Backlog
- P0 (étape 2): calendrier/rendez-vous ; temps réel (websockets) et pièces jointes pour la messagerie
- P1: vrai envoi d'e-mails (Resend), anonymisation renforcée des données de démo, avatars servis avec authentification
- P1: notifications/invitations par e-mail pour le partage ; export PDF mis en forme ; intégration institutionnelle SOS Villages d'Enfants
- P2: synchronisation des profils en mode 100% local ; mobile plus soigné


## 2026-06 — Installation & déploiement externe
- PWA : manifest.webmanifest, sw.js (cache hors /api, actif en prod), icônes 192/512/apple, bouton Installer (data-testid install-app-button) dans TopBar avec aide iOS/Android/PC.
- Déploiement externe : /app/DEPLOIEMENT.md (Atlas + Render + Vercel), /app/render.yaml, /app/frontend/vercel.json, /app/backend/requirements.txt (pip freeze + extra-index emergentintegrations).
- Backlog P1 : Calendrier, Ressources, Rapports, Notifications ; vraie appli store (projet Expo séparé) si besoin.
