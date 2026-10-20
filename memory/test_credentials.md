# Test credentials

Auth = Emergent-managed Google OAuth (no passwords).
CURRENTLY DISABLED: AUTH_ENABLED=false in /app/backend/.env -> all requests use auto user "demo-user" (no login needed). Set to true + restart backend to re-enable Google.

Test session (seeded via mongosh, see /app/auth_testing.md):
- user_id: test-user-1 / email: test.user@example.com
- session_token: test_session_1 (cookie `session_token` or header `Authorization: Bearer test_session_1`)
- Demo child "Léo" auto-created on first /api/auth/me.
