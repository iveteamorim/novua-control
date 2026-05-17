import Link from "next/link";

import {
  assignBackendOwnerAction,
  resolveIncidentAction,
  startMitigationAction,
} from "@/app/control-actions";
import {
  getAuditTrail,
  getDashboardSnapshot,
  getSourceOverview,
} from "@/lib/control/engine";
import type {
  ControlArtifact,
  DecisionAlert,
  SourceOverview,
} from "@/lib/control/types";

const severityStyles = {
  critical: "border-rose-300 bg-rose-50 text-rose-700",
  high: "border-amber-300 bg-amber-50 text-amber-700",
  medium: "border-stone-300 bg-stone-100 text-stone-700",
};

export default async function Home() {
  const [snapshot, sourceOverview] = await Promise.all([
    getDashboardSnapshot(),
    getSourceOverview(),
  ]);
  const topAlert = snapshot.primaryAlert;
  const auditTrail = await getAuditTrail(topAlert.id);

  const findArtifact = (id: string) =>
    topAlert.artifacts.find((artifact) => artifact.id === id);

  const releaseTrain = findArtifact("service-checkout");
  const blockedPr = findArtifact("pr-api-contract");
  const blockedDeploy = findArtifact("deploy-web-checkout");
  const blockedTicket = findArtifact("ticket-linear-142");
  const blockedFlag = findArtifact("flag-checkout-v2");

  const releaseWindow = getStringMetadata(releaseTrain, "releaseWindow") ?? "today";
  const impactedUsers = getNumberMetadata(blockedDeploy, "impactedUsers");
  const openHours = getNumberMetadata(blockedPr, "openHours");
  const rolloutPercentage = getNumberMetadata(blockedFlag, "rolloutPercentage");
  const liveSignalCount = sourceOverview.reduce((total, source) => total + source.signals, 0);
  const lastAuditEntries = auditTrail.slice(-3).reverse();
  const lastUpdated = lastAuditEntries[0]?.at ?? blockedDeploy?.updatedAt ?? blockedPr?.updatedAt;
  const queueAlerts = snapshot.alerts.slice(0, 4);

  const criticalSignals = [
    blockedPr?.owner
      ? `${blockedPr.owner} has not cleared the checkout API review yet.`
      : "No backend owner is assigned to the blocked checkout API review.",
    blockedDeploy?.summary ?? "The production deploy is blocked by the unresolved API dependency.",
    blockedTicket?.summary ??
      "A customer-facing release ticket is waiting on the blocked deploy path.",
    blockedFlag?.summary ?? "checkout-v2 rollout stays stuck behind the deploy gate.",
  ];
  const queueOwnerGaps = snapshot.unownedArtifacts.length;
  const queueBlockedCount = snapshot.blockedArtifacts.length;

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#151311]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[1.8rem] border border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,248,244,0.95),rgba(255,255,255,1)_48%)] p-5 shadow-[0_24px_80px_rgba(17,24,39,0.05)]">
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
                Checkout cannot ship until a backend owner clears the blocked API
                review or the team removes checkout-v2 from today&apos;s release.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <LiveStripPill
                  tone="critical"
                  label="live incident"
                  value={`updated ${formatMoment(lastUpdated)}`}
                />
                <LiveStripPill
                  tone="neutral"
                  label="signals"
                  value={`${liveSignalCount} active signals`}
                />
                {lastAuditEntries[0] ? (
                  <LiveStripPill
                    tone="neutral"
                    label="latest activity"
                    value={lastAuditEntries[0].action}
                  />
                ) : null}
              </div>
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
                label="Rollout"
                value={`${rolloutPercentage ?? 0}%`}
                critical={(rolloutPercentage ?? 0) === 0}
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
        </header>

        <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              eyebrow="Open incident queue"
              title="What else is under pressure?"
              description={`${queueBlockedCount} blocked artifacts are currently driving ${snapshot.alerts.length} escalated incidents across the queue.`}
            />
            <div className="flex flex-wrap gap-2">
              <QueueChip label="owner gaps" value={`${queueOwnerGaps}`} critical={queueOwnerGaps > 0} />
              <QueueChip label="services at risk" value={`${snapshot.servicesAtRisk.length}`} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-4">
            {queueAlerts.map((alert) => (
              <IncidentQueueCard
                key={alert.id}
                alert={alert}
                active={alert.id === topAlert.id}
              />
            ))}
          </div>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-12">
          <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)] xl:col-span-7">
            <SectionHeader
              eyebrow="Blocked release"
              title="What cannot ship?"
              description="checkout-v2 cannot ship because the checkout API review still blocks the deploy path."
            />

            <div className="mt-5 space-y-3">
              <IncidentStep
                tone="warning"
                step="1"
                title={blockedPr?.label ?? "checkout-api-contract"}
                body={blockedPr?.summary ?? "Critical API change is still waiting on review."}
                meta={blockedPr?.updatedAt ?? `${openHours ?? snapshot.meanDecisionDelayHours}h stale`}
              />
              <FlowArrow label="blocks deploy" />
              <IncidentStep
                tone="neutral"
                step="2"
                title={blockedDeploy?.label ?? "web-checkout-production"}
                body={blockedDeploy?.summary ?? "Production deploy cannot continue."}
                meta={blockedDeploy?.updatedAt ?? "updated recently"}
              />
              <FlowArrow label="delays launch" />
              <IncidentStep
                tone="critical"
                step="3"
                title={blockedTicket?.label ?? "LIN-142 checkout banner release"}
                body={blockedTicket?.summary ?? "Customer-facing work remains unresolved downstream."}
                meta={blockedTicket?.updatedAt ?? "downstream blocked"}
              />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-rose-300/60 bg-[linear-gradient(180deg,rgba(255,248,244,0.98),rgba(247,247,244,0.96))] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">
                    Release gate
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[#17120f]">
                    {blockedFlag?.label ?? "checkout-v2-rollout"}
                  </h3>
                </div>
                <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-rose-700">
                  {rolloutPercentage ?? 0}% released
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#615850]">
                {blockedFlag?.summary ??
                  "checkout-v2-rollout is still queued because the deploy gate never cleared."}
              </p>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-amber-300/45 bg-[linear-gradient(180deg,rgba(255,250,239,0.96),rgba(255,255,255,1)_28%)] p-5 shadow-[0_20px_56px_rgba(120,84,28,0.08)] xl:col-span-5">
            <SectionHeader eyebrow="Action required" title="Who should act now?" />

            <div className="mt-5 rounded-[1.35rem] border border-amber-300/80 bg-[#fff1ca] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700/82">
                Next move
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4c4138]">
                Assign the backend owner now. If nobody can take it, remove
                checkout-v2 from today&apos;s release.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <form action={assignBackendOwnerAction.bind(null, topAlert.id)}>
                <button className="inline-flex rounded-full border border-black/8 bg-black px-4 py-2 text-sm font-medium text-white transition hover:border-black hover:bg-[#17120f]">
                  Assign backend owner
                </button>
              </form>
              <form action={startMitigationAction.bind(null, topAlert.id)}>
                <button className="inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-[#f7f7f4]">
                  Start mitigation
                </button>
              </form>
              <form action={resolveIncidentAction.bind(null, topAlert.id)}>
                <button className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100">
                  Resolve incident
                </button>
              </form>
            </div>

            <div className="mt-4 space-y-3">
              <OwnerRow
                label="Release captain"
                value={topAlert.owner ?? "Unassigned"}
                status="must own the decision now"
              />
              <OwnerRow
                label="Backend owner"
                value={blockedPr?.owner ?? "Missing owner"}
                status="must clear the blocked API review"
                critical
              />
              <OwnerRow
                label="Deploy owner"
                value={blockedDeploy?.owner ?? "Frontend"}
                status="waiting on the API review to unblock shipping"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CaseFact label="Priority" value={`${topAlert.riskScore}`} />
              <CaseFact label="Current state" value={topAlert.state} />
              <CaseFact
                label="Time blocked"
                value={`${openHours ?? snapshot.meanDecisionDelayHours}h`}
              />
              <CaseFact
                label="Users affected"
                value={impactedUsers ? formatCompactNumber(impactedUsers) : "1.2k"}
              />
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)] xl:col-span-7">
            <SectionHeader
              eyebrow="Why blocked"
              title="Why did the system escalate this?"
            />

            <ul className="mt-5 grid gap-3">
              {criticalSignals.map((signal) => (
                <li
                  key={signal}
                  className="flex gap-3 rounded-[1rem] border border-black/6 bg-[#f7f7f4] px-4 py-3 text-sm leading-7 text-[#615850]"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.8rem] border border-black/6 bg-[#fbfaf8] p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)] xl:col-span-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Connected systems"
                title="Evidence connected"
                description="Full incident history, audit trail, and raw signals live inside the incident trace."
              />
              <Link
                href={`/alerts/${topAlert.id}`}
                className="inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-[#f7f7f4]"
              >
                Open incident trace
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              {sourceOverview.map((source) => (
                <SourcePill
                  key={source.source}
                  title={getSourceTitle(source.source)}
                  mode={source.mode}
                  stats={`${source.signals} signals · ${source.events} events`}
                  detail={getSourceDetail(source, snapshot.alerts)}
                />
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function getSourceTitle(source: "github" | "vercel" | "linear") {
  if (source === "github") return "GitHub";
  if (source === "vercel") return "Vercel";
  return "Linear";
}

function getAlertAgingHours(alert: DecisionAlert) {
  const hours = alert.artifacts
    .map((artifact) => {
      const openHours = getNumberMetadata(artifact, "openHours");
      const blockedHours = getNumberMetadata(artifact, "blockedHours");

      if (typeof openHours === "number") return openHours;
      if (typeof blockedHours === "number") return blockedHours;

      return parseHoursAgo(artifact.updatedAt);
    })
    .filter((value): value is number => typeof value === "number");

  return hours.length ? Math.max(...hours) : null;
}

function getSourceDetail(source: SourceOverview, alerts: DecisionAlert[]) {
  const artifacts = alerts.flatMap((alert) =>
    alert.artifacts.filter((artifact) => artifact.source === source.source),
  );

  if (source.source === "github") {
    const staleReviews = artifacts.filter((artifact) => artifact.status === "waiting_review").length;
    const ownerGaps = artifacts.filter((artifact) => artifact.owner === null).length;
    return `${staleReviews} stale review${staleReviews === 1 ? "" : "s"} · ${ownerGaps} ownership gap${ownerGaps === 1 ? "" : "s"}`;
  }

  if (source.source === "vercel") {
    const blockedDeploys = artifacts.filter((artifact) =>
      ["blocked", "failed"].includes(artifact.status),
    ).length;
    const queuedRollouts = artifacts.filter((artifact) => artifact.type === "feature_flag" && artifact.status === "queued").length;
    return `${blockedDeploys} deploy blocker${blockedDeploys === 1 ? "" : "s"} · ${queuedRollouts} rollout queue${queuedRollouts === 1 ? "" : "s"}`;
  }

  const blockedTickets = artifacts.filter((artifact) => artifact.type === "ticket" && artifact.status === "blocked").length;
  const missingOwners = artifacts.filter((artifact) => artifact.owner === null).length;
  return `${blockedTickets} blocked ticket${blockedTickets === 1 ? "" : "s"} · ${missingOwners} missing owner${missingOwners === 1 ? "" : "s"}`;
}

function CaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#2c241f]">{value}</p>
    </div>
  );
}

function CompactFact({
  label,
  value,
  critical = false,
}: {
  label: string;
  value: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-[1rem] border px-4 py-3 ${
        critical
          ? "border-rose-300/70 bg-rose-50 text-rose-700"
          : "border-black/6 bg-white"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-[0.2em] ${
          critical ? "text-rose-700/75" : "text-[#8d8176]"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}

function LiveStripPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "critical" | "neutral";
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        tone === "critical"
          ? "border-rose-300/70 bg-rose-50 text-rose-700"
          : "border-black/8 bg-white text-[#5f564e]"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          tone === "critical" ? "live-dot-critical" : "live-dot"
        }`}
      />
      <span className="uppercase tracking-[0.18em]">{label}</span>
      <span className="normal-case tracking-normal text-[#17120f]">{value}</span>
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

function parseHoursAgo(value: string | undefined) {
  if (!value) return null;

  const match = value.match(/(\d+)h ago/i);
  if (match) return Number(match[1]);

  const minuteMatch = value.match(/(\d+)m ago/i);
  if (minuteMatch) return Math.max(1, Math.round(Number(minuteMatch[1]) / 60));

  return null;
}

function QueueChip({
  label,
  value,
  critical = false,
}: {
  label: string;
  value: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
        critical
          ? "border-rose-300/70 bg-rose-50 text-rose-700"
          : "border-black/8 bg-[#f7f7f4] text-[#5f564e]"
      }`}
    >
      <span className="uppercase tracking-[0.18em]">{label}</span>
      <span className="ml-2 text-[#17120f]">{value}</span>
    </div>
  );
}

function IncidentQueueCard({
  alert,
  active,
}: {
  alert: DecisionAlert;
  active: boolean;
}) {
  const aging = getAlertAgingHours(alert);
  const missingOwners = alert.artifacts.filter((artifact) => artifact.owner === null).length;
  const blockedNodes = alert.artifacts.filter((artifact) =>
    ["blocked", "failed", "waiting_review", "queued"].includes(artifact.status),
  ).length;

  return (
    <Link
      href={active ? "/" : `/alerts/${alert.id}`}
      className={`block rounded-[1.35rem] border p-4 transition ${
        active
          ? "border-rose-300/70 bg-[linear-gradient(180deg,rgba(255,248,244,0.96),rgba(255,255,255,1))] shadow-[0_18px_42px_rgba(190,24,93,0.08)]"
          : "border-black/6 bg-[#f7f7f4] hover:border-black/10 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] ${severityStyles[alert.severity]}`}
        >
          {alert.severity}
        </span>
        <span className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">
          {aging ? `${aging}h aging` : alert.state}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-tight text-[#17120f]">
        {alert.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#615850]">{alert.summary}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <QueueMetric label="owner" value={alert.owner ?? "Unassigned"} critical={!alert.owner} />
        <QueueMetric label="state" value={alert.state} />
        <QueueMetric label="blocked" value={`${blockedNodes}`} />
        <QueueMetric label="gaps" value={`${missingOwners}`} critical={missingOwners > 0} />
      </div>
    </Link>
  );
}

function QueueMetric({
  label,
  value,
  critical = false,
}: {
  label: string;
  value: string;
  critical?: boolean;
}) {
  return (
    <div className="rounded-[0.95rem] border border-black/6 bg-white px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#93867b]">{label}</p>
      <p className={`mt-2 text-sm font-medium ${critical ? "text-rose-700" : "text-[#17120f]"}`}>
        {value}
      </p>
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

function IncidentStep({
  title,
  body,
  tone,
  step,
  meta,
}: {
  title: string;
  body: string;
  tone: "neutral" | "warning" | "critical";
  step: string;
  meta?: string;
}) {
  const toneClasses = {
    neutral: "border-black/6 bg-[#f7f7f4]",
    warning: "border-amber-300/70 bg-[#fff8e8]",
    critical: "border-rose-300/70 bg-rose-50",
  };

  return (
    <div className={`rounded-[1.2rem] border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">Step {step}</p>
        {meta ? (
          <span className="rounded-full border border-black/8 bg-white/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#7e746b]">
            {meta}
          </span>
        ) : null}
      </div>
      <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#615850]">{body}</p>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="pl-4 text-xs uppercase tracking-[0.24em] text-[#93867b]">
      {label}
    </div>
  );
}

function SourcePill({
  title,
  mode,
  stats,
  detail,
}: {
  title: string;
  mode: string;
  stats: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/6 bg-[#f7f7f4] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#7e746b]">
          <span className={mode === "live" ? "live-dot" : "h-2 w-2 rounded-full bg-stone-300"} />
          {mode}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#615850]">{stats}</p>
      <p className="mt-2 text-sm font-medium text-[#2c241f]">{detail}</p>
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

function formatMoment(value?: string | null) {
  if (!value) {
    return "just now";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  const diffMs = Date.now() - parsed;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}
