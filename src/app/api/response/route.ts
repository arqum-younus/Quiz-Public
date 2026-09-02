import { NextResponse } from "next/server";

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

  console.log("[quiz]", JSON.stringify(record));
  return NextResponse.json({ stored: false });
}
