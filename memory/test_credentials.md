# Test credentials

Auth = Emergent-managed Google OAuth (no passwords).

Test session (seeded via mongosh, see /app/auth_testing.md):
- user_id: test-user-1 / email: test.user@example.com
- session_token: test_session_1 (cookie `session_token` or header `Authorization: Bearer test_session_1`)
- Demo child "Léo" auto-created on first /api/auth/me.
