# Novua Control

Operational execution intelligence for product and engineering teams.

Novua Control detects release bottlenecks, ownership gaps, and deployment risk across engineering workflows. It ingests signals from pull requests, deployments, and tickets, builds dependency context, scores operational risk deterministically, and surfaces explainable decision alerts.

## Problem

Modern teams execute across fragmented systems: GitHub, deployment platforms, ticketing tools, and internal workflows. Important blockers are often distributed across these systems, which makes execution risk hard to see until delivery is already delayed.

Teams do not need another passive dashboard. They need a decision layer that makes operational bottlenecks visible before they become release failures.

## V1 Scope

This first version is intentionally narrow:

- GitHub pull requests
- Vercel deployments and rollout gates
- Linear-style tickets
- Dependency graph across engineering artifacts
- Deterministic risk scoring
- Explainable decision alerts
- Audit trail for escalations, ownership, and state changes

AI is assistive in this product. It explains context and recommended action. Escalation logic remains explicit and auditable.

## Core Capabilities

### Event ingestion

Operational events enter from source systems and are normalized into one internal view:

- PR review waiting
- Deployment blocked
- Deployment failed
- Ticket blocked
- Rollout queued

### Dependency graph

Artifacts are linked across systems so the engine can understand execution paths:

`PR blocked -> deployment delayed -> ticket unresolved -> release risk`

### Deterministic risk scoring

Risk is computed through policy rules, not opaque model output. Example triggers include:

- Critical PR stale for more than 12 hours
- Production deploy blocked for more than 4 hours
- Customer-facing ticket unresolved
- Missing explicit owner
- Failed canary deployment
- Release train dependency chain blocked

### Decision alerts

Alerts are not generic notifications. Each one answers:

- What is blocked
- Why it escalated
- Which artifacts are involved
- Who should act next
- What action is recommended now

### Audit trail

Every escalation keeps a trace of:

- triggering events
- ownership changes
- policy evaluations
- state changes

## Architecture

Current implementation lives under `src/lib/control`:

- `types.ts` defines the domain model
- `fixtures.ts` contains the v1 seeded execution dataset
- `engine.ts` hydrates alerts, applies deterministic scoring, and prepares dashboard snapshots

The UI is intentionally a consumer of the engine, not the source of truth.

## Product Positioning

Novua Control is not:

- another chatbot
- a generic AI assistant
- a passive engineering dashboard

Novua Control is:

- an operational decision layer for engineering execution
- an internal system for release bottleneck detection
- a full-stack product showing event-driven reasoning, ownership tracking, and explainable escalation

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Live Connectors

The default demo keeps the seeded execution scenario so the product stays understandable on first load.

You can layer live source signals on top of that seed data by creating a local `.env.local` from `.env.example`.

### GitHub

```bash
cp .env.example .env.local
```

Then set:

```bash
NOVUA_CONTROL_ENABLE_GITHUB_LIVE=1
GITHUB_TOKEN=your_github_token
NOVUA_CONTROL_GITHUB_REPO=owner/repository
```

GitHub live ingestion currently adds:

- open pull requests
- stale review detection
- missing owner detection
- requested reviewer signals
- failing checks
- merge-blocked state

### Vercel

To enable live deployment ingestion:

```bash
NOVUA_CONTROL_ENABLE_VERCEL_LIVE=1
VERCEL_TOKEN=your_vercel_token
NOVUA_CONTROL_VERCEL_PROJECT_ID=your_project_id
NOVUA_CONTROL_VERCEL_TEAM_ID=optional_team_id
```

The public demo keeps the story focused on one incident. If you want to inspect how webhook payloads are normalized, use the ingestion preview instead of the primary landing.

## Demo PR Workflow

For a stronger live demo, Novua Control should ingest at least one real GitHub pull request.

The intended flow is:

1. Open a small demo pull request in this repository
2. Leave it unassigned so the engine can surface ownership gaps
3. Let Novua Control ingest the PR through GitHub live mode
4. Use the resulting signals to compare seed data vs real operational events

This keeps the product grounded in real execution signals without making the first-load demo noisy or hard to follow.

## Webhook Ingestion Preview

Novua Control also includes ingestion preview endpoints so the normalization layer can be exercised independently from the UI.

### GitHub webhook preview

`POST /api/ingest/github`

Optional:

- `x-github-event: pull_request`
- `x-github-event: pull_request_review`
- `x-github-event: check_run`

The route returns the normalized:

- artifacts
- events
- signals

This keeps the repo legible as an operational system, not just a dashboard.

### Vercel webhook preview

`POST /api/ingest/vercel`

Optional:

- `x-vercel-event: deployment`
- `x-vercel-event: deployment.error`
- `x-vercel-event: deployment.ready`

This route previews how deployment payloads become control-layer artifacts and execution events.

## Durable Incident State

Novua Control can persist incident state, manual actions, and audit trail entries in Supabase Storage.

Set these environment variables to move beyond the local JSON fallback:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NOVUA_CONTROL_SUPABASE_BUCKET=novua-control
NOVUA_CONTROL_SUPABASE_OBJECT=control-store.json
```

With this configured:

- `Assign backend owner`
- `Start mitigation`
- `Resolve incident`

persist across reloads and deployments instead of living only in a local file.

## Next Steps

- expand GitHub live ingestion into release-aware dependency scoring
- add Vercel deployment polling or webhook ingestion
- integrate Linear or Jira ticket events
- move incident persistence from object storage to Postgres when multi-workspace data modeling is needed
- add policy configuration and replayable incident simulations

## License

This repository is source-available and proprietary.

Copyright (c) 2026 Ivete de Amorim. All rights reserved.

No permission is granted to use, copy, modify, redistribute, sell, or offer
this software as a commercial service without prior written permission from the
author. Commercial licensing is available on request via
`iveteamorim@gmail.com`.
