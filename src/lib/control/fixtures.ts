import type { ControlDataset } from "./types";

export const controlDataset: ControlDataset = {
  artifacts: [
    {
      id: "pr-api-contract",
      label: "checkout-api-contract",
      type: "pull_request",
      source: "github",
      service: "checkout-api",
      owner: null,
      status: "waiting_review",
      updatedAt: "19h ago",
      summary:
        "Schema change for checkout API is waiting on review from backend ownership.",
      metadata: {
        repository: "novua/checkout-api",
        branch: "feat/pricing-guardrails",
        criticalPath: true,
        openHours: 19,
      },
    },
    {
      id: "deploy-web-checkout",
      label: "web-checkout-production",
      type: "deployment",
      source: "vercel",
      service: "web-checkout",
      owner: "Frontend",
      status: "blocked",
      updatedAt: "4h ago",
      summary:
        "Production deployment is paused until the checkout API contract lands.",
      metadata: {
        environment: "production",
        blockedHours: 4,
        impactedUsers: 1250,
      },
    },
    {
      id: "ticket-linear-142",
      label: "LIN-142 checkout banner release",
      type: "ticket",
      source: "linear",
      service: "growth-web",
      owner: "Growth PM",
      status: "blocked",
      updatedAt: "2h ago",
      summary:
        "Customer-facing release remains blocked because frontend deploy cannot ship.",
      metadata: {
        priority: "P1",
        customerFacing: true,
      },
    },
    {
      id: "flag-checkout-v2",
      label: "checkout-v2-rollout",
      type: "feature_flag",
      source: "vercel",
      service: "web-checkout",
      owner: "Frontend",
      status: "queued",
      updatedAt: "34m ago",
      summary:
        "Rollout flag is queued behind the deployment gate for checkout v2.",
      metadata: {
        rolloutPercentage: 0,
      },
    },
    {
      id: "pr-retry-worker",
      label: "retry-worker-observability",
      type: "pull_request",
      source: "github",
      service: "payments-worker",
      owner: "Platform",
      status: "waiting_review",
      updatedAt: "11h ago",
      summary:
        "Observability patch is waiting on review while failures continue to accumulate.",
      metadata: {
        repository: "novua/payments-worker",
        openHours: 11,
      },
    },
    {
      id: "deploy-worker-canary",
      label: "payments-worker-canary",
      type: "deployment",
      source: "vercel",
      service: "payments-worker",
      owner: "Platform",
      status: "failed",
      updatedAt: "52m ago",
      summary:
        "Canary deploy failed after retry queue throughput dropped below threshold.",
      metadata: {
        environment: "canary",
        failedChecks: 3,
      },
    },
    {
      id: "ticket-linear-188",
      label: "LIN-188 refund queue delay",
      type: "ticket",
      source: "linear",
      service: "payments-ops",
      owner: null,
      status: "in_progress",
      updatedAt: "1h ago",
      summary:
        "Refund queue latency increased, but the escalation still has no explicit owner.",
      metadata: {
        priority: "P2",
        customerFacing: false,
      },
    },
    {
      id: "service-checkout",
      label: "checkout release train",
      type: "service",
      source: "github",
      service: "checkout",
      owner: "Release Captain",
      status: "blocked",
      updatedAt: "20m ago",
      summary:
        "Release train is blocked by unresolved API dependency and delayed deploy.",
      metadata: {
        releaseWindow: "today",
      },
    },
    {
      id: "flag-checkout-v2-rollback",
      label: "checkout-v2 rollback candidate",
      type: "feature_flag",
      source: "vercel",
      service: "web-checkout",
      owner: "Release Captain",
      status: "queued",
      updatedAt: "6h ago",
      summary:
        "Release rollback candidate exists but still requires release captain approval before execution.",
      metadata: {
        openHours: 6,
        rollbackCandidate: true,
      },
    },
  ],
  dependencies: [
    {
      fromId: "pr-api-contract",
      toId: "deploy-web-checkout",
      relationship: "unblocks",
    },
    {
      fromId: "deploy-web-checkout",
      toId: "ticket-linear-142",
      relationship: "delays",
    },
    {
      fromId: "deploy-web-checkout",
      toId: "flag-checkout-v2",
      relationship: "gates",
    },
    {
      fromId: "service-checkout",
      toId: "pr-api-contract",
      relationship: "depends_on",
    },
    {
      fromId: "pr-retry-worker",
      toId: "deploy-worker-canary",
      relationship: "ships",
    },
    {
      fromId: "deploy-worker-canary",
      toId: "ticket-linear-188",
      relationship: "creates_risk_for",
    },
  ],
  events: [
    {
      id: "evt-1",
      source: "github",
      artifactId: "pr-api-contract",
      kind: "review_waiting",
      at: "19h ago",
      summary: "PR waiting on backend review after API schema changes.",
      actor: "GitHub",
    },
    {
      id: "evt-2",
      source: "vercel",
      artifactId: "deploy-web-checkout",
      kind: "deploy_blocked",
      at: "4h ago",
      summary: "Production deploy paused due to missing contract approval.",
      actor: "Vercel",
    },
    {
      id: "evt-3",
      source: "linear",
      artifactId: "ticket-linear-142",
      kind: "ticket_blocked",
      at: "2h ago",
      summary: "Growth release ticket marked blocked by launch manager.",
      actor: "Linear",
    },
    {
      id: "evt-4",
      source: "vercel",
      artifactId: "flag-checkout-v2",
      kind: "rollout_queued",
      at: "34m ago",
      summary: "Feature flag rollout queued behind production deploy.",
      actor: "Vercel",
    },
    {
      id: "evt-5",
      source: "github",
      artifactId: "pr-retry-worker",
      kind: "review_waiting",
      at: "11h ago",
      summary: "Observability patch still waiting on reviewer assignment.",
      actor: "GitHub",
    },
    {
      id: "evt-6",
      source: "vercel",
      artifactId: "deploy-worker-canary",
      kind: "deploy_failed",
      at: "52m ago",
      summary: "Canary failed on retry queue smoke tests.",
      actor: "Vercel",
    },
    {
      id: "evt-7",
      source: "linear",
      artifactId: "ticket-linear-188",
      kind: "queue_latency",
      at: "1h ago",
      summary: "Refund queue incident opened without explicit owner.",
      actor: "Linear",
    },
    {
      id: "evt-8",
      source: "vercel",
      artifactId: "flag-checkout-v2-rollback",
      kind: "rollback_pending",
      at: "6h ago",
      summary: "Rollback candidate is available but still waiting on release approval.",
      actor: "Novua Control",
    },
  ],
  signals: [],
  policyRules: [
    {
      id: "rule-critical-pr-stale",
      title: "Critical PR stale > 12h",
      points: 28,
      description:
        "Critical-path pull requests waiting beyond 12 hours should escalate execution risk.",
    },
    {
      id: "rule-production-deploy-blocked",
      title: "Production deploy blocked > 4h",
      points: 30,
      description:
        "Blocked production deploys introduce release risk and require escalation.",
    },
    {
      id: "rule-customer-facing-ticket-blocked",
      title: "Customer-facing ticket unresolved",
      points: 18,
      description:
        "Blocked customer-facing tickets raise operational impact for the release train.",
    },
    {
      id: "rule-missing-owner",
      title: "Missing explicit owner",
      points: 16,
      description:
        "Artifacts without owners increase coordination risk and slow recovery.",
    },
    {
      id: "rule-failed-canary",
      title: "Canary deployment failed",
      points: 24,
      description:
        "Failed canary deploys indicate unresolved platform risk before production rollout.",
    },
    {
      id: "rule-refund-latency-persisting",
      title: "Refund latency still rising",
      points: 10,
      description:
        "Persistent refund queue latency should stay visible until the owner and mitigation path are clear.",
    },
    {
      id: "rule-release-train-dependency",
      title: "Release train dependency chain blocked",
      points: 22,
      description:
        "When one blocked artifact holds multiple downstream artifacts, escalate immediately.",
    },
    {
      id: "rule-release-owner-fallback",
      title: "Release owner fallback missing",
      points: 14,
      description:
        "Critical release paths should always have an explicit fallback owner when the primary reviewer is missing.",
    },
    {
      id: "rule-rollback-candidate-ready",
      title: "Rollback candidate available",
      points: 20,
      description:
        "When a safe rollback candidate exists, the system should keep it visible as a mitigation path.",
    },
    {
      id: "rule-rollback-approval-pending",
      title: "Rollback approval pending",
      points: 22,
      description:
        "Rollback options that still require captain approval should remain visible in the queue until a decision is made.",
    },
  ],
  alertSeeds: [
    {
      id: "alert-checkout-release",
      title: "Checkout release blocked",
      summary:
        "API review has no clear owner, the production deploy is blocked, and customer-facing launch work cannot ship.",
      recommendedAction:
        "Assign a backend owner and explicit release fallback within the next hour, or remove checkout-v2 from today’s release train.",
      owner: "Release Captain",
      artifactIds: [
        "service-checkout",
        "pr-api-contract",
        "deploy-web-checkout",
        "ticket-linear-142",
        "flag-checkout-v2",
      ],
      state: "triaged",
      triggeredRuleIds: [
        "rule-critical-pr-stale",
        "rule-production-deploy-blocked",
        "rule-customer-facing-ticket-blocked",
        "rule-release-train-dependency",
        "rule-missing-owner",
        "rule-release-owner-fallback",
      ],
    },
    {
      id: "alert-refund-queue",
      title: "Refund queue risk rising",
      summary:
        "Payments worker canary failed and the refund queue incident still has no explicit owner.",
      recommendedAction:
        "Assign platform ownership and hold the next worker rollout until canary health is restored.",
      owner: "Platform",
      artifactIds: [
        "pr-retry-worker",
        "deploy-worker-canary",
        "ticket-linear-188",
      ],
      state: "detected",
      triggeredRuleIds: [
        "rule-failed-canary",
        "rule-missing-owner",
        "rule-refund-latency-persisting",
      ],
    },
    {
      id: "alert-rollback-pending",
      title: "Rollback approval pending",
      summary:
        "Release rollback candidate exists but still requires release captain approval before execution.",
      recommendedAction:
        "Approve the rollback candidate now or explicitly keep checkout-v2 on the release path with named ownership.",
      owner: "Release Captain",
      artifactIds: ["flag-checkout-v2-rollback"],
      state: "assigned",
      triggeredRuleIds: [
        "rule-rollback-candidate-ready",
        "rule-rollback-approval-pending",
      ],
    },
  ],
  auditTrail: [
    {
      id: "audit-1",
      alertId: "alert-checkout-release",
      at: "20h ago",
      actor: "Novua Control",
      action: "Dependency chain detected",
      details:
        "Linked checkout API PR to blocked production deploy and release ticket.",
    },
    {
      id: "audit-2",
      alertId: "alert-checkout-release",
      at: "4h ago",
      actor: "Policy Engine",
      action: "Escalated release risk",
      details:
        "Production deploy exceeded 4h blocked threshold with customer-facing ticket downstream.",
    },
    {
      id: "audit-3",
      alertId: "alert-checkout-release",
      at: "3h ago",
      actor: "Release Captain",
      action: "Viewed escalation",
      details:
        "Release captain acknowledged checkout release alert but owner remains unassigned.",
    },
    {
      id: "audit-4",
      alertId: "alert-refund-queue",
      at: "58m ago",
      actor: "Vercel",
      action: "Canary failed",
      details:
        "Payments worker canary deployment failed smoke tests and opened a secondary alert.",
    },
    {
      id: "audit-5",
      alertId: "alert-checkout-release",
      at: "12m ago",
      actor: "Novua Control",
      action: "Recommended next action",
      details:
        "Suggested assigning backend owner, naming a release fallback, or rolling back checkout-v2 feature flag.",
    },
    {
      id: "audit-6",
      alertId: "alert-refund-queue",
      at: "39m ago",
      actor: "Policy Engine",
      action: "Escalated queue risk",
      details:
        "Failed canary combined with missing incident owner raised refund operations risk.",
    },
    {
      id: "audit-7",
      alertId: "alert-refund-queue",
      at: "14m ago",
      actor: "Novua Control",
      action: "Suggested mitigation",
      details:
        "Recommended assigning platform ownership before the next worker rollout proceeds.",
    },
    {
      id: "audit-8",
      alertId: "alert-rollback-pending",
      at: "6h ago",
      actor: "Novua Control",
      action: "Rollback candidate detected",
      details:
        "Rollback candidate was marked available, but release captain approval is still pending.",
    },
    {
      id: "audit-9",
      alertId: "alert-rollback-pending",
      at: "2h ago",
      actor: "Policy Engine",
      action: "Rollback left pending",
      details:
        "The rollback path remained queued without an explicit approval decision.",
    },
  ],
};
