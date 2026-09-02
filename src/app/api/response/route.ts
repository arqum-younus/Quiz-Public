import { NextResponse } from "next/server";

/**
 * Server-side outcome, named with the ms_node_* convention.
 *
 * Storage is optional on purpose: with no DATABASE_URL set the route still
 * returns 200 and logs, so the quiz works on a fresh deploy before you've
 * wired Postgres. Add the `pg` package and DATABASE_URL to persist.
 */

export const runtime = "nodejs";

type Payload = {
  answers?: Record<string, string>;
  recommended?: string;
};

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const record = {
    event: "ms_node_quiz_completed",
    recommended_plan: body.recommended ?? null,
    answers: body.answers ?? {},
    created_at: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    console.log("[quiz]", JSON.stringify(record));
    return NextResponse.json({ stored: false });
  }

  try {
    // Requires: npm install pg
    // and a table:
    //   create table quiz_responses (
    //     id bigserial primary key,
    //     recommended_plan text,
    //     answers jsonb not null,
    //     created_at timestamptz not null default now()
    //   );
    const { Client } = await import("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query(
      "insert into quiz_responses (recommended_plan, answers, created_at) values ($1, $2, $3)",
      [record.recommended_plan, record.answers, record.created_at]
    );
    await client.end();
    return NextResponse.json({ stored: true });
  } catch (error) {
    console.error("[quiz] storage failed", error);
    // The quiz result already rendered. Never fail the user's request over this.
    return NextResponse.json({ stored: false });
  }
}
