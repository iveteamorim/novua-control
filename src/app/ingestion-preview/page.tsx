import Link from "next/link";

import { SessionBar } from "@/components/session-bar";
import { requireWorkspaceSession } from "@/lib/auth/session";
import {
  normalizeGitHubWebhook,
  normalizeVercelWebhook,
  type IngestionPreview,
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

type PreviewSource = {
  id: string;
  sourceLabel: string;
  eventType: string;
  streamKey: string;
  streamTime: string;
  summary: string;
  payload: unknown;
  preview: IngestionPreview;
};

export default function IngestionPreviewPage() {
  const sessionPromise = requireWorkspaceSession("/ingestion-preview");
  return <IngestionPreviewContent sessionPromise={sessionPromise} />;
}

async function IngestionPreviewContent({
  sessionPromise,
}: {
  sessionPromise: ReturnType<typeof requireWorkspaceSession>;
}) {
  const session = await sessionPromise;
  const githubPreview = normalizeGitHubWebhook(githubPayload, "pull_request");
  const vercelPreview = normalizeVercelWebhook(vercelPayload, "deployment.error");

  const sources: PreviewSource[] = [
    {
      id: "github",
      sourceLabel: "GitHub webhook",
      eventType: "pull_request",
      streamKey: "github.pull_request",
      streamTime: "19:04:22",
      summary:
        "A blocked PR with no explicit owner and a pending review request becomes operational release evidence.",
      payload: githubPayload,
      preview: githubPreview,
    },
    {
      id: "vercel",
      sourceLabel: "Vercel webhook",
      eventType: "deployment.error",
      streamKey: "vercel.deployment.error",
      streamTime: "19:05:03",
      summary:
        "A failed production deploy becomes a release-path blocker instead of just another log line.",
      payload: vercelPayload,
      preview: vercelPreview,
    },
  ];

  const combinedEvents = dedupeKinds(
    sources.flatMap((source) => source.preview.events.map((event) => event.kind)),
  );
  const combinedSignals = dedupeKinds(
    sources.flatMap((source) => source.preview.signals.map((signal) => signal.kind)),
  );

  return (
    <main className="min-h-screen bg-[#f3f0eb] text-[#151311]">
      <div className="mx-auto flex w-full max-w-[1420px] flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <SessionBar session={session} />
        <header className="rounded-[2.15rem] border border-black/6 bg-white px-8 py-7 shadow-[0_28px_80px_rgba(17,24,39,0.05)] sm:px-10 sm:py-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.66fr)_minmax(360px,.74fr)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-black/8 bg-[#fbfaf7] px-5 py-2 text-xs font-medium uppercase tracking-[0.28em] text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white"
                >
                  Back to control
                </Link>
                <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Ingestion preview
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-[13ch] text-5xl font-semibold tracking-[-0.08em] text-[#17120f] sm:text-[4.6rem] sm:leading-[0.94] lg:text-[4.85rem]">
                  <span className="block whitespace-nowrap">Real events become</span>
                  <span className="block">operational signals.</span>
                </h1>
                <p className="max-w-[39rem] text-lg leading-9 text-[#5f564e] sm:text-[1.18rem]">
                  Control keeps the raw payload, extracts deterministic evidence,
                  and turns source events into incident-ready signals before AI
                  summarizes anything.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:max-w-[31rem] xl:self-start xl:justify-self-end">
              <HeroMetric label="Sources">
                <span className="block">GitHub +</span>
                <span className="block">Vercel</span>
              </HeroMetric>
              <HeroMetric label="Output">
                <span className="block">Artifacts /</span>
                <span className="block">Events /</span>
                <span className="block">Signals</span>
              </HeroMetric>
              <HeroMetric label="Model">
                <span className="block">Deterministic</span>
                <span className="block">first</span>
              </HeroMetric>
            </div>
          </div>
        </header>

        <section className="rounded-[2.15rem] bg-[#151312] p-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)] sm:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <SectionKicker dark>Live ingestion stream</SectionKicker>
              <h2 className="text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                Payloads entering the engine
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-neutral-400">
                The stream stays raw for audit, but only selected fields become
                operational evidence that can trigger escalation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.24em]">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-neutral-300">
                2 live payloads
              </span>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-amber-200">
                5 signals generated
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="grid gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <span className="text-sm font-medium tracking-[0.18em] text-neutral-500">
                  {source.streamTime}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">
                    {source.streamKey}
                  </p>
                  <p className="mt-1 truncate text-sm text-neutral-400">
                    {source.preview.events.length} events extracted ·{" "}
                    {source.preview.signals.length} signals generated
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-neutral-300">
                  Payload received
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.15rem] border border-black/6 bg-white p-8 shadow-[0_24px_64px_rgba(17,24,39,0.04)] sm:p-10">
          <div className="space-y-4">
            <SectionKicker>Normalization engine</SectionKicker>
            <h2 className="text-4xl font-semibold tracking-[-0.06em] text-[#17120f] sm:text-5xl">
              Webhook → Artifact → Events → Signals
            </h2>
          </div>

          <div className="mt-8 space-y-6">
            {sources.map((source) => (
              <PipelineCard key={source.id} source={source} />
            ))}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.02fr_.98fr]">
          <section className="rounded-[2.15rem] border border-black/6 bg-white p-8 shadow-[0_24px_64px_rgba(17,24,39,0.04)] sm:p-10">
            <SectionKicker>Structured evidence</SectionKicker>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[#17120f] sm:text-5xl">
              What the incident can now use
            </h2>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <EvidenceColumn
                title="Normalized events"
                tone="neutral"
                items={combinedEvents}
              />
              <EvidenceColumn
                title="Generated signals"
                tone="signal"
                items={combinedSignals}
              />
            </div>
          </section>

          <section className="rounded-[2.15rem] border border-amber-300 bg-[#fff7e7] p-8 shadow-[0_24px_64px_rgba(17,24,39,0.04)] sm:p-10">
            <SectionKicker>Decision model</SectionKicker>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[#17120f] sm:text-5xl">
              Deterministic before AI
            </h2>
            <p className="mt-6 text-lg leading-9 text-[#5f564e]">
              AI can summarize the situation, but the rule engine decides what
              becomes evidence, which thresholds were crossed, and why the
              incident escalated.
            </p>

            <div className="mt-8 space-y-4">
              <RuleCard text="Raw payload preserved for audit." />
              <RuleCard text="Only selected fields become operational evidence." />
              <RuleCard text="Signals trigger escalation before summary generation." />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PipelineCard({ source }: { source: PreviewSource }) {
  const artifact = source.preview.artifacts[0];

  return (
    <article className="rounded-[1.9rem] border border-black/6 bg-[#fbfaf7] p-6 sm:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <SourceGlyph source={source.id} />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-amber-700">
                {source.sourceLabel}
              </p>
              <h3 className="text-3xl font-semibold tracking-[-0.05em] text-[#17120f]">
                {source.eventType}
              </h3>
              <p className="max-w-3xl text-lg leading-8 text-[#5f564e]">
                {source.summary}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit rounded-full border border-black/8 bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[#6f645b]">
            Incoming event
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr_auto_1fr] xl:items-stretch">
          <FlowCard
            label="Artifact"
            icon={<DatabaseGlyph />}
            tone="neutral"
            count={null}
          >
            <p className="text-2xl font-semibold tracking-[-0.04em] text-[#17120f]">
              {artifact?.label ?? "No artifact"}
            </p>
            <p className="mt-4 text-lg leading-8 text-[#5f564e]">
              {artifact
                ? `${artifact.status} · ${artifact.summary}`
                : "No operational artifact could be derived from this payload."}
            </p>
          </FlowCard>

          <FlowArrow />

          <FlowCard
            label="Events extracted"
            icon={<EventsGlyph />}
            tone="neutral"
            count={`${source.preview.events.length} events`}
          >
            <div className="space-y-3">
              {source.preview.events.map((event) => (
                <Token key={event.id} value={event.kind} />
              ))}
            </div>
          </FlowCard>

          <FlowArrow />

          <FlowCard
            label="Signals generated"
            icon={<SignalsGlyph />}
            tone="signal"
            count={`${source.preview.signals.length} signals`}
          >
            <div className="space-y-3">
              {source.preview.signals.map((signal) => (
                <Token key={signal.id} value={signal.kind} />
              ))}
            </div>
          </FlowCard>
        </div>

        <details className="rounded-[1.35rem] border border-black/6 bg-white px-5 py-4">
          <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-[0.24em] text-[#6f645b]">
            View raw payload
          </summary>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-[#3f352d]">
            {JSON.stringify(source.payload, null, 2)}
          </pre>
        </details>
      </div>
    </article>
  );
}

function HeroMetric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.55rem] border border-black/6 bg-[#fbfaf7] px-5 py-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[#93867b]">{label}</p>
      <div className="mt-4 max-w-[10ch] overflow-hidden text-[clamp(0.92rem,0.76vw,1.12rem)] font-semibold leading-[1.16] tracking-[-0.03em] text-[#17120f] [overflow-wrap:anywhere]">
        {children}
      </div>
    </div>
  );
}

function FlowCard({
  label,
  icon,
  tone,
  count,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  tone: "neutral" | "signal";
  count: string | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.55rem] border p-6 ${
        tone === "signal"
          ? "ingestion-signal-card border-rose-200 bg-rose-50/50"
          : "border-black/6 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-10 w-10 place-items-center rounded-full border ${
              tone === "signal"
                ? "ingestion-signal-icon border-rose-200 bg-white text-rose-500"
                : "border-black/6 bg-[#fbfaf7] text-amber-700"
            }`}
          >
            {icon}
          </span>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.32em] ${
              tone === "signal"
                ? "ingestion-signal-label text-[#93867b]"
                : "text-[#93867b]"
            }`}
          >
            {label}
          </p>
        </div>

        {count ? (
          <span
            className={`text-sm font-semibold ${
              tone === "signal"
                ? "ingestion-signal-count text-[#17120f]"
                : "text-[#17120f]"
            }`}
          >
            {count}
          </span>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

function EvidenceColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "neutral" | "signal";
  items: string[];
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-6 ${
        tone === "signal"
          ? "border-rose-200 bg-rose-50/40"
          : "border-black/6 bg-[#fbfaf7]"
      }`}
    >
      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#17120f]">
        {title}
      </h3>
      <div className="mt-6 grid gap-3 min-w-0">
        {items.map((item) => (
          <div
            key={`${title}-${item}`}
            className="min-w-0 rounded-[1rem] border border-black/6 bg-white px-5 py-4 font-mono text-sm leading-6 text-[#534840] break-all"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleCard({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.4rem] border border-amber-300 bg-white px-5 py-5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckGlyph />
      </span>
      <p className="text-lg leading-8 text-[#4f463f]">{text}</p>
    </div>
  );
}

function Token({ value }: { value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3 font-mono text-sm text-[#534840]">
      {value}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center xl:flex">
      <ArrowGlyph />
    </div>
  );
}

function SectionKicker({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.44em] ${
        dark ? "text-amber-300" : "text-amber-700"
      }`}
    >
      {children}
    </p>
  );
}

function SourceGlyph({ source }: { source: string }) {
  return (
    <span className="grid h-14 w-14 place-items-center rounded-[1.25rem] border border-black/6 bg-white text-amber-700">
      {source === "github" ? <GitGlyph /> : <RocketGlyph />}
    </span>
  );
}

function DatabaseGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 6v6c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5V6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 12v6c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EventsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4H5v3M16 20h3v-3M6 18l12-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8V5h-3M4 16v3h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignalsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v6c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5 11.2 14 14.8 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GitGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 7 7Zm0 0v10m0 0a2.5 2.5 0 1 0 2.5 2.5A2.5 2.5 0 0 0 7 17Zm0-5h10m0 0a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17 12Zm0 0v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RocketGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.5 4.5c2.2.2 4 .9 4 .9s-.7 1.8-.9 4c-.2 2.1-1.3 4.1-3 5.8l-2.7 2.7-4.3-4.3 2.7-2.7c1.7-1.7 3.7-2.8 5.8-3ZM9 15l-2 2c-.8.8-2.1.8-2.8 0l-.2-.2c-.8-.8-.8-2.1 0-2.8l2-2M15 21l2-2c.8-.8.8-2.1 0-2.8l-.2-.2c-.8-.8-2.1-.8-2.8 0l-2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14.5" cy="9.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 13 4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
      <path
        d="M1 9h22m0 0-6-6m6 6-6 6"
        stroke="#D6C9BF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function dedupeKinds(items: string[]) {
  return [...new Set(items)];
}
