# Smart Investment Recommendation System for Personalized Financial Planning

## Abstract
An intelligent, explainable personal financial planning platform. Instead of predicting "which stock will rise", it understands the person first (financial profile & health), understands the goal second (goal-based planning), separates **risk tolerance** (psychological willingness) from **risk capacity** (financial ability), analyses suitable investment options third, and finally generates a personalized, explainable investment plan and portfolio allocation.

> This application is developed for educational and research purposes. It provides analytical investment suggestions based on user-provided information and available datasets. It does not guarantee returns and should not be considered a substitute for professional financial advice.

## Problem Statement
Most retail investing tools recommend products based on popularity or historical return, ignoring the individual's goals, risk capacity, financial health and diversification needs. This project builds a hybrid AI system that produces personalized, transparent recommendations grounded in the user's real financial situation.

## Objectives
- Profile the user's finances and compute a **Financial Health Score (0–100)**.
- Classify risk into 5 categories using a hybrid ML + rules engine, separating **risk tolerance** and **risk capacity**.
- Perform **goal-based planning** with scenario projections (conservative / moderate / optimistic).
- Generate **explainable recommendations** with per-investment suitability scores and "why / why not".
- Build a **personalized portfolio allocation** and support **wealth simulation** & **what-if** analysis.
- Diagnose an **existing portfolio** for concentration and risk mismatch.
- Provide an **AI financial assistant** grounded in the user's stored profile.

## Innovation
1. Goal-first investing. 2. Risk Capacity + Risk Tolerance separation. 3. Financial Health Score. 4. Hybrid AI recommendation (ML + rules + goal/risk/horizon/diversification). 5. Explainable AI. 6. Personalized portfolio allocation. 7. What-If simulation. 8. Existing-portfolio diagnosis. 9. Adaptive architecture (recommendations regenerate when inputs change).

## System Architecture
```
React Frontend  ->  FastAPI REST API  ->  Business Logic / Recommendation Engine
                                       ->  AI / ML Layer (scikit-learn)
                                       ->  MongoDB (relational-style collections)
                                       ->  Market Data / Investment Dataset (demo provider)
```
All recommendation/scoring logic runs on the backend; the frontend only renders. The market-data layer is an abstraction (`seed.py` demo provider) so a real provider can be plugged in later.

## Technology Stack
- **Frontend:** React 19, React Router, Axios, Recharts, TailwindCSS, shadcn/ui, lucide-react, sonner.
- **Backend:** Python, FastAPI, Pydantic, Motor (async MongoDB), PyJWT, bcrypt.
- **Database:** MongoDB (normalized, relational-style collections with foreign-key-style references + indexes).
- **AI/ML:** Pandas, NumPy, scikit-learn (RandomForestClassifier for risk, GradientBoostingRegressor for suitability), joblib.
- **LLM:** Claude Sonnet 4.6 (via Emergent integrations) for the AI assistant.

## Database Schema (collections)
`users`, `user_profiles`, `financial_profiles`, `risk_profiles`, `financial_goals`, `investments`, `user_holdings`, `recommendations`, `portfolios`, `simulations`, `notifications`, `chat_messages`. All non-user documents use a UUID `id`; `users` use Mongo ObjectId. References are stored as `user_id` / `investment_id`. Indexes on `users.email` (unique), `financial_goals.user_id`, `recommendations.user_id`, `user_holdings.user_id`.

## API (selected)
- Auth: `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- Profile/Financial: `GET|PUT /api/profile`, `GET|PUT /api/financial-profile`
- Risk: `POST /api/risk/assess`, `GET /api/risk/profile`
- Health: `GET /api/financial-health`
- Goals: `POST|GET /api/goals`, `GET|PUT|DELETE /api/goals/{id}`
- Recommendations: `POST /api/recommendations/generate`, `GET /api/recommendations`, `GET /api/recommendations/{id}`
- Portfolio: `POST /api/portfolio/generate`, `GET /api/portfolio`, `GET /api/portfolio/analysis`
- Holdings: `GET|POST /api/holdings`, `DELETE /api/holdings/{id}`
- Simulation: `POST /api/simulation`, `POST /api/what-if`
- Market: `GET /api/market/overview|investments|categories`
- Assistant: `POST /api/assistant/chat` (SSE stream), `GET /api/assistant/history`
- Notifications: `GET /api/notifications`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`
- Admin: `GET /api/admin/users`, `GET /api/admin/statistics`, `POST|DELETE /api/admin/investments`

## AI / ML Methodology
- **Risk classifier:** features = [age, income, expenses, savings, debt, emergency-months, dependents, employment-stability, horizon, loss-tolerance, equity-willingness, decline-reaction, experience]. Labels derived from the deterministic rule engine (single source of truth) with noise, so the RandomForest learns the domain logic. Metrics saved to `ml/metrics.json`.
- **Suitability regressor:** features combine user context and instrument characteristics; target = rule-based suitability score + noise; GradientBoosting (R^2 ~ 0.87). At inference the ML score is blended 70/30 with the rule score.
- **Graceful fallback:** if model files are missing, the engine uses the rule-based logic so the app always works.

## Recommendation Methodology (hybrid)
For each candidate investment the engine computes sub-scores — Risk Match, Goal Match, Horizon Match, Return Potential, Liquidity, Diversification Benefit — combines them into a weighted rule score, blends the ML suitability prediction, ranks, then applies a diversification filter (max 2 per category in the top list). Each result carries interpretable "why" and "why not" explanations.

## Installation
### Backend
```
cd backend
pip install -r requirements.txt
# .env: MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, EMERGENT_LLM_KEY
python ml/generate_and_train.py    # trains + saves risk_model.pkl, recommendation_model.pkl, metrics.json
uvicorn server:app --host 0.0.0.0 --port 8001   # (managed by supervisor in this environment)
```
### Frontend
```
cd frontend
yarn install
# .env: REACT_APP_BACKEND_URL
yarn start
```

## Default Accounts
- Admin: `admin@smartinvest.com` / `Admin@12345`
- Demo user (fully onboarded): `demo@smartinvest.com` / `Demo@12345`

## Model Training
`python backend/ml/generate_and_train.py` generates a synthetic dataset (documented in the script), trains both models, prints classification metrics (accuracy/precision/recall/F1 + confusion matrix) and regression metrics (R^2/MAE), and saves artifacts to `backend/ml/`.

## Testing
Backend test suite: `backend/tests/backend_test.py` (pytest). Covers auth, profiles, risk, financial health, goals, recommendation engine, portfolio, simulation and admin authorization.

## Environment Variables
Copy `backend/.env.example`. Never commit real secrets. `JWT_SECRET`, DB credentials and API keys come from env only.

## Data Flow
User -> Financial Profile -> Financial Health -> Risk Capacity & Tolerance -> Goal Analysis -> Investment Suitability -> Hybrid AI Recommendation -> Explainable Recommendation -> Portfolio Allocation -> Wealth Simulation -> Continuous Portfolio Analysis.

## Limitations & Future Scope
- Market data is a seeded demo provider (clearly labelled); a live provider can be integrated via the service abstraction.
- Portfolio optimization currently uses risk/age/goal heuristics; the architecture supports adding Mean-Variance Optimization / Efficient Frontier.
- ML models approximate the rule engine on synthetic data; they can be retrained on real behavioural data without code changes.

## Disclaimer
Educational and research use only. No guaranteed returns. Not regulated financial advice.
