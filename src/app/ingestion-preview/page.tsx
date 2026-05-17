import Link from "next/link";

import {
  normalizeGitHubWebhook,
  normalizeVercelWebhook,
} from "@/lib/control/ingestion";

const githubPayload = {
  action: "review_requested",
  repository: {
    full_name: "iveteamorim/novua-control",
  },
  pull_request: {
    number: 42,
    title: "checkout api contract",
    draft: false,
    updated_at: "2026-05-12T10:00:00.000Z",
    html_url: "https://github.com/iveteamorim/novua-control/pull/42",
    assignees: [],
    requested_reviewers: [{ login: "backend-owner" }],
    head: { ref: "checkout-api-contract" },
    base: { ref: "main" },
    mergeable_state: "blocked",
  },
};

const vercelPayload = {
  deployment: {
    uid: "dep_checkout_prod_01",
    name: "web-checkout",
    readyState: "ERROR",
    target: "production",
    createdAt: 1778662200000,
    meta: {
      githubCommitAuthorLogin: "frontend-owner",
      githubCommitRef: "checkout-v2",
      url: "https://web-checkout.vercel.app",
    },
  },
};

export default function IngestionPreviewPage() {
  const githubPreview = normalizeGitHubWebhook(githubPayload, "pull_request");
  const vercelPreview = normalizeVercelWebhook(vercelPayload, "deployment.error");

  return (
    <main className="min-h-screen bg-white text-[#151311]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <header className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(17,24,39,0.05)]">
          <div className="flex flex-col gap-5">
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex rounded-full border border-black/8 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white"
              >
                Back to control
              </Link>
              <p className="text-xs font-medium uppercase tracking-[0.38em] text-amber-700/82">
                Ingestion preview
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#17120f] sm:text-5xl">
                Real events become operational signals.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[#5f564e] sm:text-lg">
                This page shows one webhook per source, what Control extracts from
                it, and how that payload becomes incident-ready evidence.
              </p>
            </div>

            <div className="grid items-start gap-3 sm:grid-cols-3">
              <StatCard label="Preview sources" value="GitHub + Vercel" />
              <StatCard label="Output shape" value="Artifacts · Events · Signals" />
              <StatCard label="Decision model" value="Deterministic before AI" />
            </div>
          </div>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-2">
          <PreviewPanel
            source="GitHub webhook"
            eventType="pull_request"
            payload={githubPayload}
            preview={githubPreview}
            summary="A blocked PR with no explicit owner and a pending review request becomes an operational release signal."
          />
          <PreviewPanel
            source="Vercel webhook"
            eventType="deployment.error"
            payload={vercelPayload}
            preview={vercelPreview}
            summary="A failed production deploy becomes a release-path event instead of just another log line."
          />
        </section>
      </div>
    </main>
  );
}

function PreviewPanel({
  source,
  eventType,
  payload,
  preview,
  summary,
}: {
  source: string;
  eventType: string;
  payload: unknown;
  preview: {
    artifacts: Array<{ id: string; label: string; status: string; summary: string }>;
    events: Array<{ id: string; kind: string; summary: string }>;
    signals: Array<{ id: string; kind: string; summary: string }>;
  };
  summary: string;
}) {
  return (
    <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-700/82">{source}</p>
          <h2 className="text-2xl font-semibold text-[#17120f]">{eventType}</h2>
          <p className="text-sm leading-7 text-[#655c54]">{summary}</p>
        </div>
        <div className="inline-flex w-fit rounded-full border border-black/8 bg-[#f7f7f4] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#6f645b]">
          incoming event
        </div>
      </div>

      <div className="mt-6 grid items-start gap-3 sm:grid-cols-3">
        <CountCard label="Artifacts" value={String(preview.artifacts.length)} />
        <CountCard label="Events" value={String(preview.events.length)} />
        <CountCard label="Signals" value={String(preview.signals.length)} />
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-black/6 bg-[#f7f7f4] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">
          What came in
        </p>
        <p className="mt-3 text-sm leading-7 text-[#615850]">
          The raw webhook arrives first. Control keeps the original payload,
          but only a small subset becomes structured operational evidence.
        </p>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <OutputBlock
          title="Artifact"
          items={preview.artifacts.map((artifact) => ({
            title: artifact.label,
            detail: `${artifact.status} · ${artifact.summary}`,
          }))}
        />
        <SignalPathCard
          eventType={eventType}
          artifactCount={preview.artifacts.length}
          eventCount={preview.events.length}
          signalCount={preview.signals.length}
        />
        <OutputBlock
          title="Events extracted"
          items={preview.events.map((event) => ({
            title: event.kind,
            detail: event.summary,
          }))}
        />
        <OutputBlock
          title="Signals generated"
          items={preview.signals.map((signal) => ({
            title: signal.kind,
            detail: signal.summary,
          }))}
        />
      </div>

      <details className="mt-4 rounded-[1.4rem] border border-black/6 bg-[#f7f7f4] p-4">
        <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-[0.22em] text-[#6f645b]">
          View raw payload
        </summary>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-[#3f352d]">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function OutputBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; detail: string }>;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/6 bg-[#f7f7f4] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item.title}`} className="rounded-[1rem] border border-black/6 bg-white p-3">
            <p className="text-sm font-semibold text-[#17120f]">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-[#615850]">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalPathCard({
  eventType,
  artifactCount,
  eventCount,
  signalCount,
}: {
  eventType: string;
  artifactCount: number;
  eventCount: number;
  signalCount: number;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/6 bg-[#f7f7f4] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">
        Signal path
      </p>
      <div className="mt-3 space-y-2">
        <PathStep
          title="Incoming event"
          detail={`${eventType} arrives from the source system.`}
        />
        <PathStep
          title="Artifact created"
          detail={`${artifactCount} artifact${artifactCount === 1 ? "" : "s"} linked to the operational object.`}
        />
        <PathStep
          title="Events extracted"
          detail={`${eventCount} normalized event${eventCount === 1 ? "" : "s"} captured for audit and policy logic.`}
        />
        <PathStep
          title="Signals generated"
          detail={`${signalCount} release signal${signalCount === 1 ? "" : "s"} ready for escalation logic.`}
        />
      </div>
    </div>
  );
}

function PathStep({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white p-3">
      <p className="text-sm font-semibold text-[#17120f]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#615850]">{detail}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#17120f]">{value}</p>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-black/6 bg-[#f7f7f4] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}
