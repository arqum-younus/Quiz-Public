"use client";

import { useMemo, useState } from "react";
import { QUESTIONS, recommend, type Answers } from "@/lib/recommend";
import {
  INCLUDED_EVERYWHERE,
  OVERAGES,
  DISK,
  PREVIEW,
} from "@/lib/plans";
import { EVENTS, track } from "@/lib/analytics";

const SIGNUP_URL =
  "https://unified.cloudways.com/signup?utm_source=velocity&utm_medium=plan_picker&utm_campaign=velocity_plan_quiz";
const DEPLOY_GUIDE_URL = "https://www.cloudways.com/blog/deploy-nextjs/";

export default function Page() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [started, setStarted] = useState(false);

  const done = step >= QUESTIONS.length;
  const result = useMemo(() => (done ? recommend(answers) : null), [done, answers]);

  function choose(value: string) {
    const q = QUESTIONS[step];
    if (!started) {
      track(EVENTS.start);
      setStarted(true);
    }
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    track(EVENTS.questionAnswered, {
      question: q.key,
      position: step + 1,
      answer: value,
    });

    const isLast = step + 1 >= QUESTIONS.length;
    setStep(step + 1);

    if (isLast) {
      const rec = recommend(next);
      track(EVENTS.completed, {
        recommended_plan: rec.plan.id,
        bandwidth_assumed: rec.bandwidthAssumed,
      });
      void fetch("/api/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: next, recommended: rec.plan.id }),
      }).catch(() => {});
    }
  }

  function back() {
    track(EVENTS.back, { from_position: step + 1 });
    setStep(Math.max(0, step - 1));
  }

  function restart() {
    track(EVENTS.restarted);
    setAnswers({});
    setStep(0);
  }

  return (
    <main className="shell">
      <div className="masthead">
        <h1>Cloudways Velocity</h1>
        <span className="badge">{PREVIEW.label}</span>
      </div>

      {!done ? (
        <div className="quiz">
          <div className="rail" aria-hidden="true">
            {QUESTIONS.map((_, i) => (
              <span
                key={i}
                className="rail-step"
                data-state={i < step ? "done" : i === step ? "current" : "todo"}
              >
                {i + 1}
              </span>
            ))}
          </div>

          <section className="question">
            <h2>{QUESTIONS[step].prompt}</h2>
            {QUESTIONS[step].help ? (
              <p className="help">{QUESTIONS[step].help}</p>
            ) : (
              <p className="help">
                Question {step + 1} of {QUESTIONS.length}
              </p>
            )}

            <div className="choices">
              {QUESTIONS[step].choices.map((c) => (
                <button
                  key={c.value}
                  className="choice"
                  aria-pressed={answers[QUESTIONS[step].key] === c.value}
                  onClick={() => choose(c.value)}
                >
                  <span>{c.label}</span>
                  {c.note ? <span className="hint">{c.note}</span> : null}
                </button>
              ))}
            </div>

            {step > 0 ? (
              <button className="backlink" onClick={back}>
                Change my last answer
              </button>
            ) : null}
          </section>
        </div>
      ) : (
        result && (
          <section className="result">
            <p className="eyebrow">Based on your four answers</p>
            <h2>{result.plan.name} fits your app.</h2>

            <div className="price">
              {PREVIEW.freeDuringPreview ? (
                <>
                  <span className="now">Free</span>
                  <span className="was">${result.plan.listPrice}/month</span>
                  <span className="when">while Velocity is in Public Preview</span>
                </>
              ) : (
                <span className="now">${result.plan.listPrice}/month</span>
              )}
            </div>

            <div className="datasheet">
              <dl>
                <div className="row">
                  <dt>Applications</dt>
                  <dd>{result.plan.apps}</dd>
                </div>
                <div className="row">
                  <dt>vCPUs</dt>
                  <dd>{result.plan.vcpus}</dd>
                </div>
                <div className="row">
                  <dt>RAM</dt>
                  <dd>{result.plan.ramGb} GB</dd>
                </div>
                <div className="row">
                  <dt>CDN bandwidth</dt>
                  <dd>{result.plan.cdnGb} GB / month</dd>
                </div>
                <div className="row">
                  <dt>Network</dt>
                  <dd>Up to 10 Gbps</dd>
                </div>
              </dl>
            </div>

            <ul className="reasons">
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
              {result.bandwidthAssumed ? (
                <li>
                  You weren&apos;t sure about bandwidth, so this is sized on your
                  application count. Anything past {result.plan.cdnGb} GB is
                  billed at $0.02 per GB.
                </li>
              ) : null}
            </ul>

            <div className="panel">
              <h3>Included, on every plan</h3>
              <ul>
                {INCLUDED_EVERYWHERE.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            {result.headroom ? (
              <div className="panel">
                <h3>Worth considering: {result.headroom.plan.name}</h3>
                <p>{result.headroom.reason}</p>
              </div>
            ) : null}

            <div className="panel">
              <h3>Two things to know before you pick a disk size</h3>
              <ul>
                <li>
                  Disk starts at {DISK.defaultGb} GB and scales from{" "}
                  {DISK.minGb} to {DISK.maxGb} GB.
                </li>
                <li>
                  Increasing disk cannot be undone, so start small. Your plan
                  can still be downgraded at any time.
                </li>
              </ul>
            </div>

            <div className="panel">
              <h3>Charged separately</h3>
              <ul>
                {OVERAGES.map((o) => (
                  <li key={o.label}>
                    {o.label} — {o.rate}
                  </li>
                ))}
              </ul>
            </div>

            <div className="actions">
              <a
                className="cta"
                href={SIGNUP_URL}
                onClick={() =>
                  track(EVENTS.ctaClicked, {
                    cta: "signup",
                    recommended_plan: result.plan.id,
                  })
                }
              >
                Start on {result.plan.name}
              </a>
              <a
                className="cta-secondary"
                href={DEPLOY_GUIDE_URL}
                onClick={() =>
                  track(EVENTS.ctaClicked, {
                    cta: "deploy_guide",
                    recommended_plan: result.plan.id,
                  })
                }
              >
                Read the Next.js deploy guide
              </a>
              <button className="backlink" onClick={restart}>
                Start over
              </button>
            </div>
          </section>
        )
      )}
    </main>
  );
}
