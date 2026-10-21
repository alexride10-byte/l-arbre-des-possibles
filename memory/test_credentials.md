# Test credentials — Enfance+

AUTH_ENABLED=true in /app/backend/.env (set false + restart backend for demo mode without login, where every request is an auto "demo-user" with admin role).
EMAIL_MODE=simulated: verification/reset links are returned in API responses (`simulated_link`) and shown in-app. No real emails.

## Seeded accounts (email / password / role / status) — idempotent seed on backend startup
- admin@enfanceplus.fr / Admin2026! / admin (structure admin) / active
- educateur@enfanceplus.fr / Educateur2026! / educator / active (assigned: Léo, Maya)
- direction@enfanceplus.fr / Direction2026! / direction (read-only, all children) / active
- interne@enfanceplus.fr / Interne2026! / internal (Enfance+ team, no child access, /interne stats) / active
- attente@enfanceplus.fr / Attente2026! / no role / pending (shows pending screen)
- alexride10@gmail.com (product owner, Google login) / admin / active

## Seeded fictional children
seed_leo (Léo), seed_maya (Maya), seed_noah (Noah), seed_ines (Inès)

## Endpoints
POST /api/auth/register {name,email,password,accept_terms} -> {simulated_link}
POST /api/auth/verify-email {token}; POST /api/auth/resend-verification {email}
POST /api/auth/login {email,password} -> user + session_token (cookie session_token + Bearer)
POST /api/auth/forgot-password {email} -> {simulated_link}; POST /api/auth/reset-password {token,password}
GET /api/auth/sessions; DELETE /api/auth/sessions/{sid}; POST /api/auth/logout
GET /api/admin/users; PUT /api/admin/users/{uid} {status,role}; PUT /api/admin/children/{cid}/assign {user_ids}; GET /api/admin/audit
GET /api/internal/stats
POST /api/children/{cid}/avatar/generate {gender,hair,outfit,accessory,background,expression}; GET /api/avatars/{id}
Brute force: 5 failed logins per ip+email -> 429 for 15 min.
