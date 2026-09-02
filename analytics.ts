/**
 * Client-side events follow the pu_node_* convention and go to Mixpanel.
 * Server-side outcomes use ms_node_* (see src/app/api/response/route.ts).
 *
 * This file deliberately does not bundle a Mixpanel SDK. It pushes to
 * window.mixpanel if your existing loader has already put it there, and
 * always mirrors to dataLayer so GTM can pick it up. Swap in the real
 * client if you'd rather load it here.
 */

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    mixpanel?: { track: (event: string, props?: Props) => void };
    dataLayer?: unknown[];
  }
}

export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    window.mixpanel?.track(event, props);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...props });
  } catch {
    // Never let instrumentation break the quiz.
  }
}

export const EVENTS = {
  start: "pu_node_quiz_start",
  questionAnswered: "pu_node_quiz_q_answered",
  back: "pu_node_quiz_back",
  completed: "pu_node_quiz_completed",
  ctaClicked: "pu_node_quiz_cta_clicked",
  restarted: "pu_node_quiz_restarted",
} as const;
