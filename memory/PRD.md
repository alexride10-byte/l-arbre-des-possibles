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

## Backlog
- P1: IA locale (Ollama) via interface interchangeable ; export PDF mis en forme
- P1: Partage d'un profil entre parent et professionnel
- P2: quêtes personnalisées créées/sauvegardées depuis l'IA ; mobile plus soigné
