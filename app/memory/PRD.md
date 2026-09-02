# PRD — Smart Investment Recommendation System for Personalized Financial Planning

## Original Problem Statement
Build a production-style full-stack "Smart Investment Recommendation System for Personalized Financial Planning" (academic final-year project) combining AI/ML, recommendation systems, financial planning, risk profiling, portfolio optimization, explainable AI, financial health analysis and data visualization. It must understand the person first, the goal second, analyse suitable options third, and produce a personalized, explainable plan — not a stock tipster.

## User Choices (confirmed)
- Database: MongoDB (relational-style collections) — user approved over PostgreSQL due to environment.
- AI assistant model: Claude Sonnet 4.6 (Emergent Universal LLM key).
- Auth: JWT email/password with user + admin roles.
- Currency/market: INR (Indian instruments — SIP, FD, mutual funds, PPF, SGB, etc.).
- Scope: build the full core end-to-end first, then iterate.

## Architecture
React (frontend, render-only) -> FastAPI REST (/api) -> Business Logic/Recommendation Engine -> AI/ML layer (scikit-learn) -> MongoDB -> Demo market-data provider.
- Backend split: `routes_auth`, `routes_core`, `routes_planning`, `routes_market`, `routes_extra`; engine in `finance_engine.py`; ML loader `ml_model.py`; training `ml/generate_and_train.py`; seed `seed.py`; data access `store.py`.
- Auth: JWT bearer token (localStorage `si_token`) + httpOnly cookie; bcrypt hashing; admin seeded on startup.

## User Personas
1. Retail individual planning goals (home, retirement, education) wanting a personalized, understandable plan.
2. Admin managing users, investment dataset and monitoring system usage.

## Core Requirements (static)
Landing page, auth, 5-step onboarding, AI risk profiling (tolerance vs capacity), Financial Health Score, goal-based planning, hybrid explainable recommendation engine, suitability scoring, personalized portfolio, wealth simulator, what-if, existing-portfolio diagnosis, market explorer + comparison, AI assistant, notifications, admin dashboard. Security, disclaimers, reproducible ML.

## Implemented (2026-06)
- [x] Fintech landing page (Playfair/Manrope, dark slate/blue theme, workflow + features).
- [x] JWT auth (register/login/logout/me), admin + demo seeding, role-based access.
- [x] 5-step onboarding wizard (personal, income/expenses, investments, goal, risk).
- [x] Risk engine: risk score + 5 categories, risk tolerance vs risk capacity, max equity exposure; RandomForest classifier blended with rules.
- [x] Financial Health Score (0-100) with 6 category breakdown + personalized suggestions.
- [x] Goals CRUD with scenario projections + required-monthly calc; goal details page with charts.
- [x] Hybrid recommendation engine + suitability subscores + explainable why/why-not; GradientBoosting suitability model (R^2 ~0.87) blended with rules; diversification filter.
- [x] Personalized portfolio allocation (donut) with expected return/risk.
- [x] Wealth simulator (3 scenarios, area chart) + What-If analysis with goal completion.
- [x] Portfolio health analysis of existing holdings (concentration/risk diagnosis).
- [x] Investment explorer (8 categories, 17 seeded instruments) + comparison (table + radar).
- [x] AI assistant (Claude Sonnet 4.6, SSE streaming, profile-grounded, persisted history).
- [x] Notifications (auto-generated alerts, mark read/all).
- [x] Admin dashboard (stats + risk/goal/category charts + user table).
- [x] 22 frontend pages, responsive sidebar layout, INR formatting, disclaimers.
- [x] ML training pipeline with metrics (accuracy/precision/recall/F1/confusion + R^2/MAE).
- [x] Backend pytest suite (23/23 passing); testing agent verified all critical frontend flows.

## Verification
- Backend: 23/23 pytest passing. Testing agent: 100% of critical frontend flows (auth, onboarding, dashboard, goals, recommendations, portfolio, simulator, what-if, assistant streaming, notifications, admin gate + dashboard, logout).
- Known cosmetic: intermittent Recharts ResponsiveContainer width/height(-1) console warning (no visual impact).

## Backlog / Next (prioritized)
- P1: Settings — allow name/password change; theme toggle.
- P1: Recommendation history comparison view (previous vs updated) — data already stored.
- P2: Mean-Variance Optimization / Efficient Frontier module (architecture ready).
- P2: Live market-data provider integration behind existing abstraction.
- P2: Add data-testid to investment cards for easier automation; fix chart min-height warning.
- P2: Investment Explorer detail page + add-to-holdings from a recommendation.

## Next Tasks List
1. Recommendation history/versioning UI.
2. Efficient Frontier optimization.
3. Settings account management (password/name).
