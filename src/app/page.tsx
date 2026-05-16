import Link from "next/link";

import {
  getArtifactsBySource,
  getAuditTrail,
  getDashboardSnapshot,
  getSourceOverview,
} from "@/lib/control/engine";
import { formatRelativeTime } from "@/lib/control/normalize";
import type { ControlArtifact } from "@/lib/control/types";

const severityStyles = {
  critical: "border-rose-300 bg-rose-50 text-rose-700",
  high: "border-amber-300 bg-amber-50 text-amber-700",
  medium: "border-stone-300 bg-stone-100 text-stone-700",
};

export default async function Home() {
  const snapshot = await getDashboardSnapshot();
  const topAlert = snapshot.primaryAlert;
  const secondaryAlert = snapshot.alerts[1] ?? null;
  const [sourceOverview, artifactsBySource, auditTrail] = await Promise.all([
    getSourceOverview(),
    getArtifactsBySource(),
    getAuditTrail(topAlert.id),
  ]);

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

  const releaseWindow = getStringMetadata(releaseTrain, "releaseWindow") ?? "today";
  const impactedUsers = getNumberMetadata(blockedDeploy, "impactedUsers");
  const openHours = getNumberMetadata(blockedPr, "openHours");
  const rolloutPercentage = getNumberMetadata(blockedFlag, "rolloutPercentage");
  const downstreamBlockers = [blockedDeploy, blockedTicket, blockedFlag].filter(Boolean)
    .length;

  const timeline = [
    {
      at: githubEvidence?.updatedAt ?? "19h ago",
      title:
        githubEvidence && isLiveArtifact(githubEvidence) && isEscalationRelevantArtifact(githubEvidence)
          ? "Live GitHub signal detected"
          : "PR pending review",
      body:
        githubEvidence?.summary ?? "PR waiting on review; backend owner still missing.",
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
        "Production deploy blocked by upstream dependency.",
    },
    {
      at: linearEvidence?.updatedAt ?? "2h ago",
      title: "Downstream ticket delayed",
      body: linearEvidence?.summary ?? "Launch ticket blocked downstream.",
    },
    {
      at: "12m ago",
      title: "Escalation triggered",
      body: "Escalated to release captain for immediate ownership decision.",
    },
  ];

  const criticalSignals = [
    blockedPr?.owner
      ? `${blockedPr.owner} owns the upstream review path.`
      : "Backend owner missing on API review.",
    buildSignalSummary(
      vercelEvidence && isEscalationRelevantArtifact(vercelEvidence)
        ? vercelEvidence
        : null,
      "Frontend deploy blocked for 4h.",
    ),
    buildSignalSummary(linearEvidence, "Launch ticket blocked downstream."),
    buildSignalSummary(blockedFlag, "Rollout gate still closed."),
  ];

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#151311]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_24px_80px_rgba(17,24,39,0.05)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-black/8 bg-[#f7f7f4] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Novua Control
                </span>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] ${severityStyles[topAlert.severity]}`}
                >
                  {topAlert.severity} incident
                </span>
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#17120f] sm:text-[3.2rem]">
                Checkout release blocked
              </h1>
              <p className="max-w-4xl text-base leading-8 text-[#5f564e] sm:text-lg">
                This tool watches GitHub, Vercel, and Linear. It tells the team what
                release is blocked, why, who is missing, and what to do next.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-black/6 bg-[#f7f7f4] p-4 sm:grid-cols-2 xl:min-w-[380px]">
              <CompactFact label="Release window" value={releaseWindow} />
              <CompactFact
                label="Users affected"
                value={impactedUsers ? formatCompactNumber(impactedUsers) : "1.2k"}
              />
              <CompactFact
                label="Upstream delay"
                value={`${openHours ?? snapshot.meanDecisionDelayHours}h`}
              />
              <CompactFact
                label="Downstream blockers"
                value={`${downstreamBlockers}`}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/alerts/${topAlert.id}`}
              className="inline-flex rounded-full border border-black/8 bg-black px-4 py-2 text-sm font-medium text-white transition hover:border-black hover:bg-[#17120f]"
            >
              Open incident trace
            </Link>
            <Link
              href="/ingestion-preview"
              className="inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-[#f7f7f4]"
            >
              View raw signals
            </Link>
          </div>

          <div className="mt-5 grid gap-3 rounded-[1.35rem] border border-black/6 bg-[#f7f7f4] p-4 md:grid-cols-4">
            <MiniGuideStep step="1" label="Blocked release" value="Checkout cannot ship." />
            <MiniGuideStep step="2" label="Cause" value="API review still unowned." />
            <MiniGuideStep step="3" label="Owner gap" value="Backend owner missing." />
            <MiniGuideStep step="4" label="Next move" value="Assign owner or pull it from release." />
          </div>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.18fr_0.92fr]">
          <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="4. Next move"
              title="What should the team do now?"
            />

            <div className="mt-5 rounded-[1.35rem] border border-amber-300/60 bg-[#fff8e8] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700/82">
                Next action
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4c4138]">
                Assign backend owner or remove checkout-v2 from today&apos;s release.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <CaseFact label="Priority" value={`${topAlert.riskScore}`} />
              <CaseFact label="Current state" value={topAlert.state} />
              <CaseFact label="Escalation owner" value={topAlert.owner ?? "Unassigned"} />
              <CaseFact label="Missing owner" value={blockedPr?.owner ?? "Backend owner missing"} />
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="1. Blocked release"
              title="What is blocked?"
            />

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] xl:grid-cols-1">
              <FlowNode
                tone="warning"
                title={blockedPr?.label ?? "checkout-api-contract"}
                body={blockedPr?.summary ?? "Critical API change is still waiting on review."}
              />
              <FlowArrow label="blocks deploy" />
              <FlowNode
                tone="neutral"
                title={blockedDeploy?.label ?? "web-checkout-production"}
                body={blockedDeploy?.summary ?? "Production deploy cannot continue."}
              />
              <FlowArrow label="delays launch" />
              <FlowNode
                tone="critical"
                title={blockedTicket?.label ?? "LIN-142 checkout banner release"}
                body={blockedTicket?.summary ?? "Customer-facing work remains unresolved downstream."}
              />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-black/6 bg-[#f7f7f4] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">
                    Release gate
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[#17120f]">
                    {blockedFlag?.label ?? "checkout-v2-rollout"}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#7e746b]">
                  {rolloutPercentage ?? 0}% released
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#615850]">
                {blockedFlag?.summary ??
                  "checkout-v2-rollout is still queued because the deploy gate never cleared."}
              </p>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-black/6 bg-[#f7f7f4] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">
                Why it is blocked
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

          <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="3. Owner gap"
              title="Who needs to act?"
            />

            <div className="mt-5 space-y-3">
              <OwnerRow
                label="Escalation owner"
                value={topAlert.owner ?? "Unassigned"}
                status="driving the decision"
              />
              <OwnerRow
                label="Backend owner"
                value={blockedPr?.owner ?? "Missing owner"}
                status="missing on the blocked review"
                critical
              />
              <OwnerRow
                label="Deploy owner"
                value={blockedDeploy?.owner ?? "Frontend"}
                status="waiting on API review"
              />
              <OwnerRow
                label="Ticket owner"
                value={blockedTicket?.owner ?? "Growth PM"}
                status="blocked by deployment"
              />
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-black/6 bg-[#f7f7f4] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">
                Another problem forming
              </p>
              <h3 className="mt-2 text-base font-semibold text-[#17120f]">
                {secondaryAlert?.title ?? "Refund queue risk rising"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#615850]">
                {secondaryAlert?.summary ??
                  "A secondary incident is already forming in the background while checkout remains blocked."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="2. Why it escalated"
              title="What happened?"
            />

            <div className="mt-5 space-y-4">
              {timeline.map((item) => (
                <TimelineItem
                  key={`${item.at}-${item.title}`}
                  at={formatTimeLabel(item.at)}
                  title={item.title}
                  body={item.body}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="5. System trace"
              title="What did the system record?"
            />

            <div className="mt-5 space-y-4">
              {auditTrail.map((entry) => (
                <TimelineItem
                  key={entry.id}
                  at={formatTimeLabel(entry.at)}
                  title={entry.action}
                  body={formatAuditBody(entry)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
          <SectionHeader
            eyebrow="6. Signals"
            title="Where did this evidence come from?"
          />

          <div className="mt-5 grid gap-4 md:grid-cols-3">
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
  artifact: ControlArtifact | null | undefined,
  fallback: string,
) {
  if (!artifact) {
    return fallback;
  }

  return artifact.summary;
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

function CaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#2c241f]">{value}</p>
    </div>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8d8176]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}

function MiniGuideStep({
  step,
  label,
  value,
}: {
  step: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#93867b]">
        {step}. {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#2c241f]">{value}</p>
    </div>
  );
}

function getStringMetadata(
  artifact: ControlArtifact | null | undefined,
  key: string,
) {
  const value = artifact?.metadata?.[key];

  return typeof value === "string" ? value : null;
}

function getNumberMetadata(
  artifact: ControlArtifact | null | undefined,
  key: string,
) {
  const value = artifact?.metadata?.[key];

  return typeof value === "number" ? value : null;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatTimeLabel(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatRelativeTime(parsed);
}

function formatAuditBody(entry: {
  actor: string;
  details: string;
  beforeState?: string;
  afterState?: string;
}) {
  const stateChange =
    entry.beforeState && entry.afterState
      ? ` (${entry.beforeState} → ${entry.afterState})`
      : "";

  return `${entry.actor} · ${entry.details}${stateChange}`;
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
}: {
  title: string;
  subtitle: string;
  value: string;
  headline: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/6 bg-[#f7f7f4] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{subtitle}</p>
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
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.32em] text-amber-700/82">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#17120f]">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#655c54]">{description}</p>
      ) : null}
    </div>
  );
}
