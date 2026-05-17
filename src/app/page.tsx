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
  watch: "border-stone-300 bg-stone-100 text-stone-700",
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
  const queueAlerts = snapshot.alerts.slice(0, 3);

  const queueOwnerGaps = snapshot.unownedArtifacts.length;
  const queueBlockedCount = snapshot.blockedArtifacts.length;

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#151311]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2.2rem] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,249,245,0.98),rgba(255,255,255,1)_42%)] shadow-[0_30px_90px_rgba(17,24,39,0.05)]">
          <div className="grid items-start xl:grid-cols-[minmax(0,1fr)_392px]">
            <div className="px-6 py-7 sm:px-7 sm:py-8 xl:px-10 xl:py-10">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-black/8 bg-white px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-[#7e746b]">
                    Novua Control
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] ${severityStyles[topAlert.severity]}`}
                  >
                    {topAlert.severity} incident
                  </span>
                </div>

                <h1 className="max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-[#17120f] sm:text-[5.75rem]">
                  Checkout release
                  <br />
                  blocked
                </h1>

                <p className="max-w-3xl text-lg leading-9 text-[#5f564e]">
                  Checkout cannot ship until a backend owner clears the blocked API
                  review or the team removes checkout-v2 from today&apos;s release.
                </p>

                <div className="flex max-w-3xl flex-wrap gap-3 pt-1">
                  <LiveStripPill
                    tone="critical"
                    label="live incident"
                    value={`updated ${formatMoment(lastUpdated)}`}
                  />
                  <LiveStripPill
                    tone="neutral"
                    label="signals"
                    value={`${liveSignalCount} active`}
                  />
                  {lastAuditEntries[0] ? (
                    <LiveStripPill
                      tone="neutral"
                      label="latest"
                      value={lastAuditEntries[0].action}
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 pt-3">
                  <Link
                    href={`/alerts/${topAlert.id}`}
                    className="inline-flex rounded-full border border-black/8 bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:border-black hover:bg-[#17120f]"
                  >
                    Open incident trace
                  </Link>
                  <Link
                    href="/ingestion-preview"
                    className="inline-flex rounded-full border border-black/8 bg-white px-6 py-3.5 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-[#f7f7f4]"
                  >
                    View raw signals
                  </Link>
                </div>
              </div>
            </div>

            <aside className="border-t border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,247,244,0.92))] px-6 py-7 sm:px-7 sm:py-8 xl:border-l xl:border-t-0 xl:px-8 xl:py-10">
              <div className="rounded-[1.55rem] border border-rose-300/80 bg-white p-5 shadow-[0_14px_36px_rgba(225,29,72,0.07)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">
                      Risk score
                    </p>
                    <p className="mt-3 text-7xl font-semibold leading-none tracking-[-0.055em] text-[#17120f]">
                      {topAlert.riskScore}
                    </p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-rose-200 bg-rose-50 text-rose-500">
                    <RiskShieldIcon />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-2">
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
            </aside>
          </div>
        </header>

        <section className="rounded-[2.05rem] border border-black/8 bg-[#171413] p-6 text-white shadow-[0_24px_70px_rgba(17,24,39,0.18)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.42em] text-[#e9b062]">
                Open incident queue
              </p>
              <h2 className="mt-4 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
                What else is under pressure?
              </h2>
              <p className="mt-4 max-w-2xl text-[1.05rem] leading-8 text-white/58">
                {queueBlockedCount} blocked artifacts are currently driving {snapshot.alerts.length} escalated incidents across the queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <QueueChip label="owner gaps" value={`${queueOwnerGaps}`} critical={queueOwnerGaps > 0} />
              <QueueChip label="services at risk" value={`${snapshot.servicesAtRisk.length}`} />
            </div>
          </div>

          <div className="mt-7 grid items-start gap-4 xl:grid-cols-3">
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

          <section className="rounded-[1.95rem] border border-amber-300/55 bg-[linear-gradient(180deg,rgba(255,251,241,0.98),rgba(255,255,255,1)_30%)] p-6 shadow-[0_22px_60px_rgba(120,84,28,0.08)] xl:col-span-5">
            <SectionHeader eyebrow="Action required" title="Who should act now?" />

            <div className="mt-6 rounded-[1.5rem] border border-amber-300/85 bg-[#fff6df] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="text-xs uppercase tracking-[0.28em] text-orange-600">
                Next move
              </p>
              <p className="mt-4 text-lg leading-8 text-[#4c4138]">
                Assign the backend owner now. If nobody can take it, remove
                checkout-v2 from today&apos;s release.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <form action={assignBackendOwnerAction.bind(null, topAlert.id)}>
                <button className="inline-flex rounded-full border border-black/8 bg-black px-5 py-3 text-sm font-medium text-white transition hover:border-black hover:bg-[#17120f]">
                  Assign backend owner
                </button>
              </form>
              <form action={startMitigationAction.bind(null, topAlert.id)}>
                <button className="inline-flex rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-[#f7f7f4]">
                  Start mitigation
                </button>
              </form>
              <form action={resolveIncidentAction.bind(null, topAlert.id)}>
                <button className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100">
                  Resolve incident
                </button>
              </form>
            </div>

            <div className="mt-6 space-y-4">
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
          </section>

          <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)] xl:col-span-7">
            <SectionHeader
              eyebrow="Why blocked"
              title="Why did the system escalate this?"
            />

            <div className="mt-5 grid gap-4">
              <ReasonRow
                icon="owner"
                text={
                  blockedPr?.owner
                    ? `${blockedPr.owner} has not cleared the blocked checkout API review yet.`
                    : "No backend owner is assigned to the blocked checkout API review."
                }
              />
              <ReasonRow
                icon="dependency"
                text={
                  blockedDeploy?.summary ??
                  "Production deploy is blocked by an unresolved API dependency."
                }
              />
              <ReasonRow
                icon="alert"
                text={
                  blockedTicket?.summary ??
                  "Customer-facing release remains blocked because frontend deploy cannot ship."
                }
              />
              <ReasonRow
                icon="pulse"
                text={
                  blockedFlag?.summary ??
                  "Rollout flag is queued behind the deployment gate for checkout v2."
                }
              />
            </div>
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

            <div className="mt-5 grid items-start gap-3 md:grid-cols-3 xl:grid-cols-1">
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
      className={`rounded-[1.25rem] border px-5 py-4 ${
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
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[#17120f]">
        {value}
      </p>
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

function RiskShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l6 2.8v5.9c0 4.1-2.5 7.9-6 9.3-3.5-1.4-6-5.2-6-9.3V5.8L12 3z" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
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
      className={`rounded-full border px-4 py-2 text-xs font-medium ${
        critical
          ? "border-rose-400/55 bg-rose-500/10 text-rose-100"
          : "border-white/12 bg-white/5 text-white/74"
      }`}
    >
      <span className="uppercase tracking-[0.22em]">{label}</span>
      <span className={`ml-2 ${critical ? "text-white" : "text-white/92"}`}>{value}</span>
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
      className={`flex h-full flex-col rounded-[1.5rem] border p-5 transition ${
        active
          ? "border-rose-400/55 bg-white/[0.05] shadow-[0_16px_32px_rgba(190,24,93,0.08)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] ${
            alert.severity === "critical"
              ? "border-rose-400/65 text-rose-200"
              : "border-white/18 text-white/72"
          }`}
        >
          {alert.severity}
        </span>
        <span className="text-xs uppercase tracking-[0.22em] text-white/36">
          {aging ? `${aging}h aging` : alert.state}
        </span>
      </div>

      <h3 className="mt-6 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-white">
        {alert.title}
      </h3>
      <p className="mt-4 min-h-[6.75rem] text-[1.02rem] leading-8 text-white/56">{alert.summary}</p>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/28">Risk</p>
            <p className="mt-3 text-sm text-white/46">
              {missingOwners} owner gap{missingOwners === 1 ? "" : "s"} · {blockedNodes} blocked node{blockedNodes === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-[3rem] font-semibold leading-none tracking-[-0.05em] text-white">
            {alert.riskScore}
          </p>
        </div>
      </div>
    </Link>
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
          ? "border-amber-300/80 bg-white"
          : "border-black/6 bg-white/82"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
          <p className="mt-2 text-[1.85rem] font-semibold leading-none tracking-[-0.035em] text-[#17120f]">
            {value}
          </p>
        </div>
        <p className="max-w-[13rem] text-sm leading-7 text-[#615850] md:text-right">
          {status}
        </p>
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

function ReasonRow({
  icon,
  text,
}: {
  icon: "owner" | "dependency" | "alert" | "pulse";
  text: string;
}) {
  return (
    <div className="flex items-center gap-5 rounded-[1.25rem] border border-black/6 bg-[#f8f7f4] px-5 py-5 text-[#4f463f] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff0db] text-[#f06f1c]">
        <ReasonIcon kind={icon} />
      </span>
      <p className="text-[1.05rem] leading-8">{text}</p>
    </div>
  );
}

function ReasonIcon({ kind }: { kind: "owner" | "dependency" | "alert" | "pulse" }) {
  if (kind === "owner") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 14a4 4 0 1 0-4-4" />
        <path d="M12 14c2.6 0 4.8 1.2 6 3" />
        <path d="M5 19l2.5-2.5" />
        <path d="M5 16.5V19h2.5" />
      </svg>
    );
  }

  if (kind === "dependency") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="7" r="2.5" />
        <circle cx="17" cy="12" r="2.5" />
        <circle cx="7" cy="17" r="2.5" />
        <path d="M9.3 8.3l5.1 2.4" />
        <path d="M9.3 15.7l5.1-2.4" />
      </svg>
    );
  }

  if (kind === "alert") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4l8 14H4L12 4z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h4l2-5 4 10 2-5h4" />
    </svg>
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
