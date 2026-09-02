/**
 * Velocity plan matrix.
 * Transcribed from the in-product "Choose Your Plan" screen (Public Preview).
 * This is the ONLY place plan data lives. Update here when pricing changes.
 */

export type PlanId = "starter" | "professional" | "growth" | "scale" | "plus";

export type Plan = {
  id: PlanId;
  name: string;
  /** List price per month, in USD. Currently waived during Public Preview. */
  listPrice: number;
  apps: number;
  vcpus: number;
  ramGb: number;
  cdnGb: number;
};

/** Ordered smallest to largest. Order matters for the recommendation logic. */
export const PLANS: Plan[] = [
  { id: "starter",      name: "Starter",      listPrice: 20,  apps: 5,  vcpus: 2, ramGb: 2,  cdnGb: 100 },
  { id: "professional", name: "Professional", listPrice: 30,  apps: 8,  vcpus: 2, ramGb: 4,  cdnGb: 200 },
  { id: "growth",       name: "Growth",       listPrice: 50,  apps: 14, vcpus: 4, ramGb: 8,  cdnGb: 300 },
  { id: "scale",        name: "Scale",        listPrice: 100, apps: 30, vcpus: 8, ramGb: 16, cdnGb: 400 },
  { id: "plus",         name: "Plus",         listPrice: 150, apps: 50, vcpus: 8, ramGb: 32, cdnGb: 500 },
];

/** Included on every plan, at no extra cost. */
export const INCLUDED_EVERYWHERE = [
  "Enterprise CDN",
  "DDoS protection",
  "Malware protection",
];

/** Charges that sit outside the plan price. */
export const OVERAGES = [
  { label: "Offsite backup storage", rate: "$0.033 / GB" },
  { label: "CDN bandwidth beyond your allocation", rate: "$0.02 / GB" },
];

export const DISK = {
  minGb: 10,
  maxGb: 1000,
  defaultGb: 25,
  /** Increases cannot be undone. Plans themselves can still be downgraded. */
  scaleUpIsIrreversible: true,
};

export const PREVIEW = {
  /** All plans are free during Public Preview. Flip to false when billing starts. */
  freeDuringPreview: true,
  label: "Public Preview",
};
