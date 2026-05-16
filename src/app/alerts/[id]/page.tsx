import Link from "next/link";
import { notFound } from "next/navigation";

import {
  assignBackendOwnerAction,
  resolveIncidentAction,
  startMitigationAction,
} from "@/app/control-actions";
import {
  getAlertById,
  getAuditTrail,
  getSourceOverview,
} from "@/lib/control/engine";
import { formatRelativeTime } from "@/lib/control/normalize";

const severityStyles = {
  critical: "border-rose-300 bg-rose-50 text-rose-700",
  high: "border-amber-300 bg-amber-50 text-amber-700",
  medium: "border-stone-300 bg-stone-100 text-stone-700",
};

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [alert, auditTrail, sourceOverview] = await Promise.all([
    getAlertById(id),
    getAuditTrail(id),
    getSourceOverview(),
  ]);

  if (!alert) {
    notFound();
  }

  const affectedSystems = Array.from(
    new Set(alert.artifacts.map((artifact) => artifact.service)),
  )
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-white text-[#151311]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <header className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(17,24,39,0.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex rounded-full border border-black/8 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white"
              >
                Back to control
              </Link>
              <p className="text-xs font-medium uppercase tracking-[0.38em] text-amber-700/82">
                Alert trace
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#17120f] sm:text-5xl">
                {alert.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[#5f564e] sm:text-lg">
                {alert.summary}
              </p>
            </div>

            <div className="space-y-3 rounded-[1.4rem] border border-black/6 bg-[#f7f7f4] p-4 sm:min-w-[260px]">
              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${severityStyles[alert.severity]}`}
              >
                {alert.severity} risk
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">
                  Risk score
                </p>
                <p className="mt-2 text-4xl font-semibold text-[#17120f]">
                  {alert.riskScore}
                </p>
              </div>
              <SummaryLine label="State" value={alert.state} />
              <SummaryLine label="Owner" value={alert.owner ?? "Unassigned"} />
              <SummaryLine label="Systems" value={affectedSystems} />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Decision rationale"
              title="Why this escalated"
              description="The escalation is deterministic. AI can summarize the situation, but the rule engine remains the source of truth."
            />

            <div className="mt-6 space-y-3">
              {alert.rules.map((evaluation) => (
                <div
                  key={evaluation.rule.id}
                  className="rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-[#17120f]">
                      {evaluation.rule.title}
                    </h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#6d6259]">
                      +{evaluation.rule.points} pts
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#615850]">
                    {evaluation.rule.description}
                  </p>
                  <p className="mt-3 text-sm text-[#403730]">
                    <span className="font-medium text-[#17120f]">Evidence:</span>{" "}
                    {evaluation.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Recommended action"
              title="What should happen next"
              description="The system does not just surface the blocker. It pushes toward the next operational decision."
            />

            <div className="mt-6 rounded-[1.4rem] border border-amber-300/60 bg-[#fff8e8] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700/82">
                Next action
              </p>
              <p className="mt-3 text-base leading-8 text-[#3f352d]">
                {alert.recommendedAction}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <form action={assignBackendOwnerAction.bind(null, alert.id)}>
                <button className="inline-flex rounded-full border border-black/8 bg-black px-4 py-2 text-sm font-medium text-white transition hover:border-black hover:bg-[#17120f]">
                  Assign backend owner
                </button>
              </form>
              <form action={startMitigationAction.bind(null, alert.id)}>
                <button className="inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-[#f7f7f4]">
                  Start mitigation
                </button>
              </form>
              <form action={resolveIncidentAction.bind(null, alert.id)}>
                <button className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100">
                  Resolve incident
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-3">
              <SummaryCard
                label="Artifacts in chain"
                value={String(alert.artifacts.length)}
              />
              <SummaryCard label="Rules triggered" value={String(alert.rules.length)} />
              <SummaryCard label="Audit entries" value={String(auditTrail.length)} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Dependency chain"
              title="Execution path under risk"
              description="This is the chain the system linked together before escalating."
            />

            <div className="mt-6 space-y-3">
              {alert.artifacts.map((artifact, index) => (
                <div key={artifact.id}>
                  <ArtifactCard
                    title={artifact.label}
                    source={artifact.source}
                    status={artifact.status}
                    owner={artifact.owner ?? "Unassigned"}
                    detail={artifact.summary}
                    updatedAt={artifact.updatedAt}
                  />
                  {index < alert.artifacts.length - 1 ? (
                    <div className="pl-4 pt-3 text-xs uppercase tracking-[0.24em] text-[#93867b]">
                      ↓ dependency propagates
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Audit trail"
              title="How the state changed"
              description="Escalation history makes the system feel operational, not conceptual."
            />

            <div className="mt-6 space-y-4">
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

        <section className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
          <SectionHeader
            eyebrow="Connected systems"
            title="What the decision is grounded on"
            description="The alert stays compressed, but the underlying systems still need to remain legible."
          />

          <div className="mt-4 flex justify-start">
            <Link
              href="/ingestion-preview"
              className="inline-flex rounded-full border border-black/8 px-3.5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white"
            >
              Open ingestion preview
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {sourceOverview.map((source) => (
              <SourceCard
                key={source.source}
                title={getSourceTitle(source.source)}
                stats={`${source.signals} signals · ${source.events} events · ${source.artifacts} artifacts`}
              />
            ))}
          </div>
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

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#17120f]">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-[#f7f7f4] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}

function ArtifactCard({
  title,
  source,
  status,
  owner,
  detail,
  updatedAt,
}: {
  title: string;
  source: string;
  status: string;
  owner: string;
  detail: string;
  updatedAt: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d6259]">
              {source}
            </span>
            <span className="rounded-full bg-[#fff8e8] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
              {status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#615850]">{detail}</p>
        </div>
        <div className="text-sm text-[#615850] sm:text-right">
          <p>{updatedAt}</p>
          <p className="mt-1 font-medium text-[#17120f]">{owner}</p>
        </div>
      </div>
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
    <div className="grid gap-2 rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4 sm:grid-cols-[110px_1fr]">
      <div className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{at}</div>
      <div>
        <p className="text-sm font-semibold text-[#17120f]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#615850]">{body}</p>
      </div>
    </div>
  );
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

function SourceCard({
  title,
  stats,
}: {
  title: string;
  stats: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/6 bg-[#f7f7f4] p-4">
      <h3 className="text-lg font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-3 text-sm text-[#615850]">{stats}</p>
    </div>
  );
}
