import Link from "next/link";

import {
  getArtifactsBySource,
  getDashboardSnapshot,
  getSourceOverview,
} from "@/lib/control/engine";
import type { ControlArtifact, SourceOverview } from "@/lib/control/types";

const severityStyles = {
  critical: "border-rose-300 bg-rose-50 text-rose-700",
  high: "border-amber-300 bg-amber-50 text-amber-700",
  medium: "border-stone-300 bg-stone-100 text-stone-700",
};

export default async function Home() {
  const [snapshot, sourceOverview, artifactsBySource] = await Promise.all([
    getDashboardSnapshot(),
    getSourceOverview(),
    getArtifactsBySource(),
  ]);
  const topAlert = snapshot.primaryAlert;
  const sourceModes = Object.fromEntries(
    sourceOverview.map((source) => [source.source, source.mode]),
  ) as Record<"github" | "vercel" | "linear", "seed" | "live">;

  const findArtifact = (id: string) =>
    topAlert.artifacts.find((artifact) => artifact.id === id);

  const releaseTrain = findArtifact("service-checkout");
  const blockedPr = findArtifact("pr-api-contract");
  const blockedDeploy = findArtifact("deploy-web-checkout");
  const blockedTicket = findArtifact("ticket-linear-142");
  const blockedFlag = findArtifact("flag-checkout-v2");
  const githubEvidence = pickPrimarySourceArtifact(
    artifactsBySource.github,
    "github",
    blockedPr,
  );
  const vercelEvidence = pickPrimarySourceArtifact(
    artifactsBySource.vercel,
    "vercel",
    blockedDeploy,
  );
  const linearEvidence = pickPrimarySourceArtifact(
    artifactsBySource.linear,
    "linear",
    blockedTicket,
  );

  const affectedSystems = Array.from(
    new Set(topAlert.artifacts.map((artifact) => artifact.service)),
  )
    .filter(Boolean)
    .join(", ");

  const timeline = [
    {
      at: githubEvidence?.updatedAt ?? "19h ago",
      title:
        githubEvidence && isLiveArtifact(githubEvidence) && isEscalationRelevantArtifact(githubEvidence)
          ? "Live GitHub signal detected"
          : "PR pending review",
      body:
        githubEvidence?.summary ??
        "Critical API contract change has been waiting too long without a backend owner.",
    },
    {
      at:
        vercelEvidence && isEscalationRelevantArtifact(vercelEvidence)
          ? vercelEvidence.updatedAt
          : blockedDeploy?.updatedAt ?? "4h ago",
      title:
        vercelEvidence && isLiveArtifact(vercelEvidence) && isEscalationRelevantArtifact(vercelEvidence)
          ? "Live Vercel signal detected"
          : "Deployment blocked",
      body:
        (vercelEvidence && isEscalationRelevantArtifact(vercelEvidence)
          ? vercelEvidence.summary
          : blockedDeploy?.summary) ??
        "Production deployment is blocked while the unresolved dependency remains open.",
    },
    {
      at: linearEvidence?.updatedAt ?? "2h ago",
      title: "Downstream ticket delayed",
      body:
        linearEvidence?.summary ??
        "Customer-facing release work is blocked by the deployment delay.",
    },
    {
      at: "12m ago",
      title: "Escalation triggered",
      body: topAlert.recommendedAction,
    },
  ];

  const criticalSignals = [
    buildSignalSummary(
      sourceModes.github,
      githubEvidence,
      "Critical PR pending review for 19h",
    ),
    buildSignalSummary(
      sourceModes.vercel,
      vercelEvidence && isEscalationRelevantArtifact(vercelEvidence)
        ? vercelEvidence
        : null,
      "Frontend deploy blocked for 4h",
    ),
    buildSignalSummary(
      sourceModes.linear,
      linearEvidence,
      "Customer-facing launch ticket unresolved",
    ),
    buildSignalSummary(
      "seed",
      blockedFlag,
      "Feature flag rollout still queued",
    ),
    githubEvidence?.owner
      ? `${githubEvidence.owner} currently owns the upstream review path`
      : "No backend owner explicitly assigned",
  ];

  return (
    <main className="min-h-screen bg-white text-[#151311]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <header className="grid gap-6 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(17,24,39,0.05)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.38em] text-amber-700/82">
              Novua Control
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#17120f] sm:text-5xl">
              Operational execution intelligence for product and engineering teams.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-[#5f564e] sm:text-lg">
              Detects blocked releases, ownership gaps, and deployment risk across
              GitHub, Vercel, and Linear.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Active alerts"
                value={String(snapshot.alerts.length)}
                accent="text-amber-700"
              />
              <MetricCard
                label="Blocked artifacts"
                value={String(snapshot.blockedArtifacts.length)}
                accent="text-rose-700"
              />
              <MetricCard
                label="Mean decision delay"
                value={`${snapshot.meanDecisionDelayHours}h`}
                accent="text-stone-700"
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-black/6 bg-[#f7f7f4] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8d8176]">
              Connected evidence
            </p>
            <div className="mt-4 space-y-3">
              <SignalStep
                source={`GitHub · ${sourceModes.github}`}
                title={githubEvidence?.label ?? "PR waiting on review"}
                detail={
                  githubEvidence?.summary ??
                  "checkout-api-contract has no backend owner"
                }
              />
              <SignalStep
                source={`Vercel · ${sourceModes.vercel}`}
                title={vercelEvidence?.label ?? "Deploy blocked"}
                detail={
                  vercelEvidence?.summary ??
                  "web-checkout-production cannot ship"
                }
              />
              <SignalStep
                source={`Linear · ${sourceModes.linear}`}
                title={linearEvidence?.label ?? "Ticket unresolved"}
                detail={
                  linearEvidence?.summary ??
                  "launch work stays blocked downstream"
                }
              />
              <SignalStep
                source="Control"
                title="Escalation triggered"
                detail="assign owner or rollback checkout-v2"
                terminal
              />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Critical case"
              title="Checkout release blocked by unresolved API dependency."
              description="One upstream review delay is now holding the deploy, the downstream launch, and the flag rollout."
            />

            <div className="mt-6 rounded-[1.6rem] border border-black/6 bg-[#f7f7f4] p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${severityStyles[topAlert.severity]}`}
                  >
                    {topAlert.severity} risk
                  </span>
                  <h2 className="text-4xl font-semibold text-[#17120f]">
                    {topAlert.riskScore}
                    <span className="ml-2 text-lg font-medium text-[#7b726b]">
                      risk score
                    </span>
                  </h2>
                  <Link
                    href={`/alerts/${topAlert.id}`}
                    className="inline-flex rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-black hover:text-white"
                  >
                    Open alert trace
                  </Link>
                  <Link
                    href="/ingestion-preview"
                    className="ml-3 inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#6f645b] transition hover:border-black/15 hover:bg-[#f7f7f4] hover:text-[#17120f]"
                  >
                    See ingestion preview
                  </Link>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
                  <CaseFact label="Affected systems" value={affectedSystems} />
                  <CaseFact label="Escalation owner" value={topAlert.owner ?? "Unassigned"} />
                  <CaseFact label="Missing owner" value={blockedPr?.owner ?? "Backend owner missing"} />
                  <CaseFact label="Recommended action" value="Assign backend owner or rollback flag" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.3rem] border border-black/6 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8d8176]">
                    Why it matters
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#615850]">
                    {topAlert.recommendedAction}
                  </p>
                </div>

                <div className="rounded-[1.3rem] border border-black/6 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8d8176]">
                    Signals behind the alert
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#615850]">
                    {criticalSignals.map((signal) => (
                      <li key={signal} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Ownership chain"
              title="Nobody is missing in theory. Someone is missing in practice."
              description="Control surfaces where coordination breaks before the team notices it too late."
            />

            <div className="mt-6 space-y-3">
              <OwnerRow
                label="Release coordination"
                value={topAlert.owner ?? "Unassigned"}
                status="tracking release"
              />
              <OwnerRow
                label="Backend approval"
                value={blockedPr?.owner ?? "Missing owner"}
                status="blocking upstream"
                critical
              />
              <OwnerRow
                label="Frontend deploy"
                value={blockedDeploy?.owner ?? "Frontend"}
                status="waiting on API dependency"
              />
              <OwnerRow
                label="Launch ticket"
                value={blockedTicket?.owner ?? "Growth PM"}
                status="downstream blocked"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Dependency flow"
              title="One blocked review creates a release chain."
              description="This is the core behavior: one unresolved upstream dependency propagates execution risk downstream."
            />

            <div className="mt-6 space-y-3">
              <FlowNode
                tone="neutral"
                title={releaseTrain?.label ?? "checkout release train"}
                body={releaseTrain?.summary ?? "Release coordination sees the whole path blocked."}
              />
              <FlowArrow label="depends on" />
              <FlowNode
                tone="warning"
                title={blockedPr?.label ?? "checkout-api-contract"}
                body={blockedPr?.summary ?? "Critical API change is still waiting on review."}
              />
              <FlowArrow label="blocks" />
              <FlowNode
                tone="neutral"
                title={blockedDeploy?.label ?? "web-checkout-production"}
                body={blockedDeploy?.summary ?? "Production deploy cannot continue."}
              />
              <FlowArrow label="delays" />
              <FlowNode
                tone="critical"
                title={blockedTicket?.label ?? "LIN-142 checkout banner release"}
                body={blockedTicket?.summary ?? "Customer-facing work remains unresolved downstream."}
              />
              <div className="rounded-[1.15rem] border border-amber-300/60 bg-[#fff8e8] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-700/82">
                  rollout still queued
                </p>
                <p className="mt-2 text-sm text-[#615850]">
                  {blockedFlag?.summary ??
                    "checkout-v2-rollout is still queued because the deploy gate never cleared."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Escalation timeline"
              title="Why this escalated"
              description="The system only escalates once the event chain creates enough deterministic evidence."
            />

            <div className="mt-6 space-y-4">
              {timeline.map((item) => (
                <TimelineItem
                  key={`${item.at}-${item.title}`}
                  at={item.at}
                  title={item.title}
                  body={item.body}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
          <SectionHeader
            eyebrow="Operational detail"
            title="Signals feeding the decision layer"
            description="The detailed operational view stays below the fold. The landing shows the decision, not every raw event first."
          />

          <div className="mt-4 flex justify-start">
            <Link
              href="/ingestion-preview"
              className="inline-flex rounded-full border border-black/8 px-3.5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white"
            >
              View ingestion preview
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {sourceOverview.map((source) => (
              <CompactSourceCard
                key={source.source}
                title={getSourceTitle(source.source)}
                subtitle={getSourceSubtitle(source.source)}
                value={`${source.signals} signals · ${source.events} events · ${source.artifacts} artifacts`}
                headline={getSourceEvidenceHeadline(
                  source.source,
                  githubEvidence,
                  vercelEvidence,
                  linearEvidence,
                )}
                mode={source.mode}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function isLiveArtifact(artifact: ControlArtifact) {
  return artifact.id.startsWith("live-");
}

function isEscalationRelevantArtifact(artifact: ControlArtifact) {
  return ["blocked", "failed", "waiting_review", "queued"].includes(artifact.status);
}

function getArtifactPriority(artifact: ControlArtifact) {
  const statusScore = {
    blocked: 5,
    failed: 5,
    waiting_review: 4,
    queued: 3,
    in_progress: 2,
    healthy: 1,
  }[artifact.status];

  return statusScore + (artifact.owner ? 0 : 0.5);
}

function pickPrimarySourceArtifact(
  artifacts: ControlArtifact[],
  source: "github" | "vercel" | "linear",
  fallback?: ControlArtifact,
) {
  const liveArtifacts = artifacts.filter(
    (artifact) => artifact.source === source && isLiveArtifact(artifact),
  );
  const riskyLiveArtifacts = liveArtifacts.filter(isEscalationRelevantArtifact);
  const candidates = (
    riskyLiveArtifacts.length > 0
      ? riskyLiveArtifacts
      : liveArtifacts.length > 0
        ? liveArtifacts
        : artifacts
  ).slice();

  candidates.sort((left, right) => getArtifactPriority(right) - getArtifactPriority(left));

  if (riskyLiveArtifacts.length === 0 && fallback) {
    return fallback;
  }

  return candidates[0] ?? fallback ?? null;
}

function buildSignalSummary(
  mode: SourceOverview["mode"],
  artifact: ControlArtifact | null | undefined,
  fallback: string,
) {
  if (!artifact) {
    return fallback;
  }

  const prefix = mode === "live" ? "Live signal:" : "Seed signal:";
  return `${prefix} ${artifact.summary}`;
}

function getSourceEvidenceHeadline(
  source: "github" | "vercel" | "linear",
  githubEvidence: ControlArtifact | null,
  vercelEvidence: ControlArtifact | null,
  linearEvidence: ControlArtifact | null,
) {
  if (source === "github") return githubEvidence?.label ?? "No GitHub evidence";
  if (source === "vercel") return vercelEvidence?.label ?? "No Vercel evidence";
  return linearEvidence?.label ?? "No Linear evidence";
}

function getSourceTitle(source: "github" | "vercel" | "linear") {
  if (source === "github") return "GitHub";
  if (source === "vercel") return "Vercel";
  return "Linear";
}

function getSourceSubtitle(source: "github" | "vercel" | "linear") {
  if (source === "github") return "review + merge state";
  if (source === "vercel") return "deploy + rollout state";
  return "delivery + ownership state";
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/6 bg-[#f7f7f4] px-4 py-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#8f8378]">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function SignalStep({
  source,
  title,
  detail,
  terminal = false,
}: {
  source: string;
  title: string;
  detail: string;
  terminal?: boolean;
}) {
  return (
    <div className="relative rounded-[1.2rem] border border-black/6 bg-white p-4">
      {!terminal ? (
        <span className="absolute left-6 top-full h-4 w-px bg-black/10" />
      ) : null}
      <p className="text-xs uppercase tracking-[0.22em] text-[#8f8378]">{source}</p>
      <h3 className="mt-2 text-base font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-1 text-sm text-[#615850]">{detail}</p>
    </div>
  );
}

function CaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#2c241f]">{value}</p>
    </div>
  );
}

function OwnerRow({
  label,
  value,
  status,
  critical = false,
}: {
  label: string;
  value: string;
  status: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-4 ${
        critical
          ? "border-amber-300/70 bg-[#fff8e8]"
          : "border-black/6 bg-[#f7f7f4]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
          <p className="mt-2 text-base font-semibold text-[#17120f]">{value}</p>
        </div>
        <p className="max-w-[11rem] text-right text-sm text-[#615850]">{status}</p>
      </div>
    </div>
  );
}

function FlowNode({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "neutral" | "warning" | "critical";
}) {
  const toneClasses = {
    neutral: "border-black/6 bg-[#f7f7f4]",
    warning: "border-amber-300/70 bg-[#fff8e8]",
    critical: "border-rose-300/70 bg-rose-50",
  };

  return (
    <div className={`rounded-[1.2rem] border p-4 ${toneClasses[tone]}`}>
      <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#615850]">{body}</p>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="pl-4 text-xs uppercase tracking-[0.24em] text-[#93867b]">
      ↓ {label}
    </div>
  );
}

function TimelineItem({
  at,
  title,
  body,
}: {
  at: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-2 rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4 sm:grid-cols-[120px_1fr]">
      <div className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{at}</div>
      <div>
        <p className="text-sm font-semibold text-[#17120f]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#615850]">{body}</p>
      </div>
    </div>
  );
}

function CompactSourceCard({
  title,
  subtitle,
  value,
  headline,
  mode,
}: {
  title: string;
  subtitle: string;
  value: string;
  headline: string;
  mode: "seed" | "live";
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/6 bg-[#f7f7f4] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{subtitle}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
            mode === "live"
              ? "bg-[#17120f] text-white"
              : "bg-white text-[#6d6259]"
          }`}
        >
          {mode}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-2 text-sm font-medium text-[#2d241d]">{headline}</p>
      <p className="mt-3 text-sm text-[#615850]">{value}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.32em] text-amber-700/82">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#17120f]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#655c54]">{description}</p>
    </div>
  );
}
