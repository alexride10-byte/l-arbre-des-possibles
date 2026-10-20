# Auth testing (Emergent Google Auth)

## Create test user & session
mongosh --eval "
use('test_database');
db.users.updateOne({user_id:'test-user-1'},{\$set:{user_id:'test-user-1',email:'test.user@example.com',name:'Test User',audience:'pro',created_at:new Date().toISOString()}},{upsert:true});
db.user_sessions.updateOne({session_token:'test_session_1'},{\$set:{user_id:'test-user-1',session_token:'test_session_1',expires_at:new Date(Date.now()+30*24*3600*1000)}},{upsert:true});
"

## Backend
curl -H "Authorization: Bearer test_session_1" $API/api/auth/me

## Browser
Add cookie: name=session_token value=test_session_1 domain=<preview host> path=/ httpOnly secure sameSite=None, then open /.
A demo child "Léo" is auto-seeded for any user with no profiles.
