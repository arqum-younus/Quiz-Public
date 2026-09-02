# Velocity Plan Picker

Four questions, one recommended Velocity plan. A Next.js App Router app built to run on
Cloudways Velocity, so it dogfoods the product it sells.

## Why it exists

Five plans on one screen is choice overload at the moment of commitment. This narrows
five to one, and it captures what people are actually deploying while it does so.

## How the recommendation works

Tier is decided by the two constraints a user can predict: **number of applications** and
**CDN bandwidth**. The larger of the two requirements wins.

RAM and vCPU are displayed but never used to pick a tier — there's no data mapping app
workload to memory, so inventing thresholds would make the quiz worse than no quiz. The
"where is this app today" answer only produces an optional headroom suggestion, never an
automatic upgrade.

All plan data lives in `src/lib/plans.ts`. That is the only file to edit when pricing
changes, including the `PREVIEW.freeDuringPreview` flag when billing starts.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Velocity

1. Push this repo to GitHub.
2. In the Cloudways console, open **Velocity** and click **Get Started**.
3. Choose a plan. Starter is plenty for this app.
4. Click **Connect Via Git**, link GitHub, and select the repo.
5. Velocity scans `package.json`, finds `next`, and selects the **Next.js SSR** preset
   automatically. No start script, PM2 config, or Nginx work needed.
6. Click **Deploy Now**, then open the Application URL from the **Overview** tab.

Do not add `output: 'export'` to `next.config.mjs`. The API route needs a running server.

## Optional: persist responses

The quiz works with no database. To keep the responses:

```
npm install pg
```

Set `DATABASE_URL` to the Postgres instance included with your plan, then create:

```sql
create table quiz_responses (
  id bigserial primary key,
  recommended_plan text,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
```

If storage fails the user still sees their result — the write is never on the critical path.

## Instrumentation

Client events go to Mixpanel via `window.mixpanel` if your loader has already set it, and
mirror to `dataLayer` for GTM either way. Nothing breaks if neither is present.

| Event | Fires when |
| --- | --- |
| `pu_node_quiz_start` | First answer selected |
| `pu_node_quiz_q_answered` | Each answer, with question key and position |
| `pu_node_quiz_back` | Someone changes their last answer |
| `pu_node_quiz_completed` | Result renders, with recommended plan |
| `pu_node_quiz_cta_clicked` | Signup or deploy-guide click |
| `pu_node_quiz_restarted` | Start over |
| `ms_node_quiz_completed` | Server-side, in `/api/response` |

The metric to watch first is per-question drop-off. If question 3 or 4 leaks badly, cut
to two questions — app count and bandwidth carry the tier math on their own.
