import { PLANS, type Plan, type PlanId } from "./plans";

/**
 * Recommendation rules.
 *
 * Tier is decided ONLY by the two published constraints that actually differ
 * in a way a user can predict: number of applications, and CDN bandwidth.
 * RAM and vCPU are reported, never used to guess a tier — we have no data
 * mapping app workload to memory, so inventing thresholds would be dishonest.
 *
 * Workload and stage answers are used for copy and for a headroom note only.
 */

export type AnswerKey = "apps" | "bandwidth" | "stack" | "stage";

export type Choice = {
  value: string;
  label: string;
  /** Minimum applications this answer implies. */
  minApps?: number;
  /** Minimum monthly CDN GB this answer implies. */
  minCdnGb?: number;
  note?: string;
};

export type Question = {
  key: AnswerKey;
  prompt: string;
  help?: string;
  choices: Choice[];
};

export const QUESTIONS: Question[] = [
  {
    key: "apps",
    prompt: "How many applications will you run?",
    help: "A staging copy of your app counts as its own application.",
    choices: [
      { value: "one",     label: "Just one",        minApps: 1 },
      { value: "few",     label: "2 to 5",          minApps: 5 },
      { value: "several", label: "6 to 14",         minApps: 14 },
      { value: "many",    label: "15 to 30",        minApps: 30 },
      { value: "lots",    label: "More than 30",    minApps: 50 },
    ],
  },
  {
    key: "bandwidth",
    prompt: "Roughly how much bandwidth do you serve each month?",
    help: "Anything over your allocation is billed at $0.02 per GB, so a rough answer is fine.",
    choices: [
      { value: "under100", label: "Under 100 GB",       minCdnGb: 100 },
      { value: "to200",    label: "100 to 200 GB",      minCdnGb: 200 },
      { value: "to300",    label: "200 to 300 GB",      minCdnGb: 300 },
      { value: "to500",    label: "300 to 500 GB",      minCdnGb: 500 },
      { value: "unknown",  label: "I don't know yet",   note: "sized on your app count instead" },
    ],
  },
  {
    key: "stack",
    prompt: "What does your app need alongside it?",
    choices: [
      { value: "app",   label: "Just the app" },
      { value: "db",    label: "A database" },
      { value: "cache", label: "A database and caching" },
      { value: "unsure", label: "Still working that out" },
    ],
  },
  {
    key: "stage",
    prompt: "Where is this app today?",
    choices: [
      { value: "side",  label: "A side project" },
      { value: "live",  label: "Live, with real users" },
      { value: "prod",  label: "Production, and revenue depends on it" },
    ],
  },
];

export type Answers = Partial<Record<AnswerKey, string>>;

export type Recommendation = {
  plan: Plan;
  /** Plain-language reasons the tier was chosen. */
  reasons: string[];
  /** Optional suggestion to consider the next tier up, with the reason why. */
  headroom: { plan: Plan; reason: string } | null;
  /** Sized without a bandwidth answer. */
  bandwidthAssumed: boolean;
};

function choiceFor(key: AnswerKey, value: string | undefined): Choice | undefined {
  if (!value) return undefined;
  return QUESTIONS.find((q) => q.key === key)?.choices.find((c) => c.value === value);
}

function smallestPlanMeeting(predicate: (p: Plan) => boolean): Plan {
  return PLANS.find(predicate) ?? PLANS[PLANS.length - 1];
}

function indexOfPlan(id: PlanId): number {
  return PLANS.findIndex((p) => p.id === id);
}

export function recommend(answers: Answers): Recommendation {
  const appsChoice = choiceFor("apps", answers.apps);
  const bwChoice = choiceFor("bandwidth", answers.bandwidth);

  const minApps = appsChoice?.minApps ?? 1;
  const minCdnGb = bwChoice?.minCdnGb;
  const bandwidthAssumed = minCdnGb === undefined;

  const byApps = smallestPlanMeeting((p) => p.apps >= minApps);
  const byBandwidth = bandwidthAssumed
    ? byApps
    : smallestPlanMeeting((p) => p.cdnGb >= minCdnGb!);

  const winner =
    indexOfPlan(byBandwidth.id) > indexOfPlan(byApps.id) ? byBandwidth : byApps;

  const reasons: string[] = [];
  reasons.push(
    `It covers ${winner.apps} applications, which fits the ${appsChoice?.label.toLowerCase() ?? "one"} you told us about.`
  );
  if (!bandwidthAssumed) {
    reasons.push(
      `Its ${winner.cdnGb} GB of CDN bandwidth covers your ${bwChoice?.label.toLowerCase()} without overage charges.`
    );
  }

  // Headroom note — a suggestion, never an automatic upgrade.
  let headroom: Recommendation["headroom"] = null;
  const nextUp = PLANS[indexOfPlan(winner.id) + 1];
  if (nextUp && answers.stage === "prod") {
    headroom = {
      plan: nextUp,
      reason:
        "Since revenue depends on this app, some teams start one tier up for headroom. You can downgrade at any time.",
    };
  }

  return { plan: winner, reasons, headroom, bandwidthAssumed };
}
