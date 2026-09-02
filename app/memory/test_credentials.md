# Test Credentials

## Admin
- Email: admin@smartinvest.com
- Password: Admin@12345
- Role: admin
- Landing: /admin

## Demo User (fully onboarded, has profile + risk + goals + portfolio + recommendations)
- Email: demo@smartinvest.com
- Password: Demo@12345
- Role: user
- Landing: /dashboard

## Notes
- Login page has "Login as Demo User" and "Login as Admin" quick buttons (data-testid="demo-user-button", "demo-admin-button").
- Auth: JWT bearer token returned in login/register response body as `token`, stored in localStorage key `si_token`, sent as `Authorization: Bearer <token>`. httpOnly cookie also set but frontend uses bearer token.
- New users are routed to /onboarding (5-step wizard) after register.

## Key auth endpoints
- POST /api/auth/register  {name,email,password}
- POST /api/auth/login     {email,password}
- POST /api/auth/logout
- GET  /api/auth/me
