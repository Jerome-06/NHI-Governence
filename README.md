# NHI Governance Dashboard

A web application for discovering, evaluating, and monitoring the security posture of non-human identities (NHIs) — API keys and service accounts used by AI agents and automation.

## Problem

Enterprise security tools are built to monitor human logins. They largely ignore machine credentials: API keys, service accounts, and tokens used by AI agents and automation. These non-human identities now outnumber human employees by a wide margin, yet in most organizations nobody owns them, reviews their permissions, or notices when one is left behind by a project that no longer exists.

This project simulates the discovery and governance layer that would sit on top of a cloud environment: it ingests a snapshot of identities and their granted permissions, ingests 30 days of activity logs, and evaluates each identity against three security principles — Least Privilege, Segregation of Duties, and Orphan Identity — plus a fourth check, Purpose Boundary, that flags activity outside an identity's registered purpose.

## Architecture

```
React frontend
      │  HTTP
      ▼
FastAPI backend  (/ingest, /identities, /identities/{id}, /risks)
      │
      ▼
Data loader  →  parses and validates uploaded directory + activity JSON
      │
      ▼
PostgreSQL  →  identities table, activities table (truncated and replaced on each ingest)
      │
      ▼
Risk engine  →  runs on read, not precomputed at ingest time
      │
      ▼
Results returned to dashboard
```

Risk evaluation is intentionally **not** precomputed and stored. Each time an identity's detail is requested, the risk engine re-runs against the current database state. This keeps the risk logic as a single source of truth used identically by both the list-all endpoint (`/risks`) and the single-identity endpoint (`/identities/{id}`), at the cost of recomputing on every request rather than caching — acceptable at this dataset size, but a real trade-off at scale (see Limitations).

## Tech stack

- **Backend:** Python, FastAPI
- **Database:** PostgreSQL (via `psycopg2`, parameterized queries)
- **Frontend:** React (Vite)
- **No agent framework used** — the task is deterministic rule evaluation over structured data. An LLM/agent framework (e.g. LangGraph) would add latency and non-determinism without improving correctness here, so one was deliberately not used.

## Setup

### Backend
```
pip install -r requirements.txt
```
Create a `.env` file in the project root:
```
DB_NAME=nhi_governance
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```
Run the migration script to create tables, then start the API:
```
python migrate_data.py
uvicorn main:app --reload
```

### Frontend
```
cd frontend
npm install
npm run dev
```

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/ingest` | Upload directory + activity JSON, replaces current dataset |
| GET | `/identities` | List all identities with orphan status |
| GET | `/identities/{account_id}` | Full risk analysis for one identity |
| GET | `/risks` | Risk analysis across all identities |

## Risk checks implemented

- **Orphan Identity** — flags any identity with no assigned agent (`agent is None`)
- **Least Privilege** — compares granted permissions against permissions actually exercised in the activity log; flags any granted-but-unused permission
- **Segregation of Duties** — flags an identity holding both `write:payments` and `approve:payments`
- **Purpose Boundary** *(beyond the spec's three required checks)* — flags activity on a resource outside the identity's registered purpose

Each flagged risk includes a plain-language reason, written for a reviewer who has no prior context on the specific identity.

## Design decisions and trade-offs

- **Truncate-and-replace on ingest, not append.** Each upload represents "current state" of the environment, matching the assignment's framing of a discovery scan. This means historical scans aren't retained — acceptable for a single-snapshot assessment tool, but would need an append-and-timestamp model for tracking drift over time.
- **Risk evaluation on read, not precomputed.** Simpler and guarantees consistency between endpoints, at the cost of recomputing per request. Fine at this scale; would need caching or a background job at production scale.
- **Segregation of Duties is a hardcoded rule**, not a general "any create+approve conflict" engine. It correctly catches the payments scenario in the spec's example but wouldn't generalize to a different resource pair without code changes.

## Known limitations

- Purpose Boundary checks only recognize two purposes (`Invoice Processing`, `Generate Reports`); any identity with an unmapped purpose currently has all of its activity flagged, since unmapped purposes default to zero allowed resources.
- No handling for duplicate `account_id` values within a single upload.
- No file size limit on uploaded JSON.
- CORS is currently hardcoded to `localhost:5173` for local development and would need updating for a deployed environment.
- Ingest validation requires `account_id`, `type`, `purpose`, and `permissions`, but not `agent` — an identity JSON omitting the `agent` key entirely (rather than setting it to `null`) will pass ingest validation but fail during risk evaluation.

## Possible next steps

- Generalize the Segregation of Duties check into a configurable list of conflicting permission pairs
- Persist scan history to support drift/trend analysis over time instead of only current-state snapshots
- Add authentication in front of the API before any real deployment