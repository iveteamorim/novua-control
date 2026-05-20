import Link from "next/link";

import { createWorkspaceAction } from "@/app/auth/actions";
import { getWorkspaceContext } from "@/lib/auth/accounts";
import { getWorkspaceIntegrationMap } from "@/lib/control/store";
import type { SourceSystem, WorkspaceIntegrationRecord } from "@/lib/control/types";
import { requireSession } from "@/lib/auth/session";

const providers: Array<{
  provider: SourceSystem;
  title: string;
  description: string;
}> = [
  {
    provider: "github",
    title: "GitHub",
    description: "Pull requests, stale reviews, and missing owner signals.",
  },
  {
    provider: "vercel",
    title: "Vercel",
    description: "Deploy failures, blocked environments, and rollout pressure.",
  },
  {
    provider: "linear",
    title: "Linear",
    description: "Downstream launch tickets and customer-facing release impact.",
  },
];

function getIntegrationTone(status?: WorkspaceIntegrationRecord["status"]) {
  if (status === "connected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "degraded") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-600";
}

function getIntegrationLabel(status?: WorkspaceIntegrationRecord["status"]) {
  if (status === "connected") {
    return "connected";
  }

  if (status === "degraded") {
    return "degraded";
  }

  return "not configured";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession("/onboarding");
  const params = await searchParams;
  const context = await getWorkspaceContext(session.userId, session.workspaceId);

  if (!context?.workspace) {
    return (
      <main className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-[#151311]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)] sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.36em] text-amber-700">
            Workspace setup
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#17120f]">
            Name your first workspace
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f564e]">
            Workspaces keep incidents, actions, and audit history separated per team.
          </p>
          {params.error ? (
            <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
          <form action={createWorkspaceAction} className="mt-8 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                Workspace name
              </span>
              <input
                name="workspaceName"
                required
                className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                placeholder="Acme release ops"
              />
            </label>
            <button className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white">
              Create workspace
            </button>
          </form>
        </div>
      </main>
    );
  }

  const integrationMap = await getWorkspaceIntegrationMap(context.workspace.id);
  const connectedCount = providers.filter(
    ({ provider }) => integrationMap[provider]?.status === "connected",
  ).length;
  const minimumPathReady =
    integrationMap.github?.status === "connected" &&
    integrationMap.vercel?.status === "connected";
  const fullyConnected = connectedCount === providers.length;

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-4 py-5 text-[#151311] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <header className="rounded-[2rem] border border-black/6 bg-[linear-gradient(135deg,rgba(255,247,239,0.98),rgba(255,255,255,1)_48%)] px-6 py-7 shadow-[0_24px_80px_rgba(17,24,39,0.05)] sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Workspace created
                </span>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-amber-700">
                  Self onboarding
                </span>
              </div>

              <p className="mt-6 text-xs font-medium uppercase tracking-[0.36em] text-amber-700">
                Activation flow
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#17120f] sm:text-[3.2rem]">
                Your workspace is ready. Now connect the systems that make one release path operational.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#5f564e] sm:text-lg">
                Novua Control already created <span className="font-medium text-[#17120f]">{context.workspace.name}</span>.
                The next step is not another form. It is connecting the core tools,
                checking the signal path, and opening the first incident view with live workspace context.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-black/6 bg-white p-4 sm:grid-cols-3 xl:min-w-[420px] xl:grid-cols-1">
              <OnboardingStat label="Workspace" value="1 created" />
              <OnboardingStat
                label="Connected"
                value={`${connectedCount}/${providers.length}`}
              />
              <OnboardingStat
                label="Minimum path"
                value={minimumPathReady ? "ready" : "pending"}
              />
            </div>
          </div>
        </header>

        {params.error ? (
          <p className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {decodeURIComponent(params.error)}
          </p>
        ) : null}

        <section className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Step 1"
              title="Connect the systems that already hold the release data"
            />

            <div className="mt-5 grid gap-3">
              {providers.map(({ provider, title, description }) => {
                const integration = integrationMap[provider];

                return (
                  <div
                    key={provider}
                    className="rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-xl">
                        <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#615850]">{description}</p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] ${getIntegrationTone(integration?.status)}`}
                      >
                        {getIntegrationLabel(integration?.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-amber-300/70 bg-[#fff6df] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700">
                Recommended first path
              </p>
              <p className="mt-2 text-sm leading-7 text-[#5a4a37]">
                Connect <span className="font-medium text-[#17120f]">GitHub + Vercel</span> first to detect blocked reviews and failed deploys on one release path.
                Add <span className="font-medium text-[#17120f]">Linear</span> next to connect downstream launch pressure.
              </p>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-black/6 bg-[#17120f] p-5 text-white shadow-[0_24px_72px_rgba(17,24,39,0.08)]">
            <SectionHeader
              eyebrow="Step 2"
              title="Open the first operational flow"
              dark
            />

            <div className="mt-5 space-y-3">
              <ChecklistRow
                done
                title="Workspace created"
                body={`${context.workspace.name} is already provisioned for ${session.email}.`}
              />
              <ChecklistRow
                done={connectedCount > 0}
                title="At least one source connected"
                body={
                  connectedCount > 0
                    ? `${connectedCount} integration${connectedCount > 1 ? "s are" : " is"} already configured for this workspace.`
                    : "No live source is connected yet."
                }
              />
              <ChecklistRow
                done={minimumPathReady}
                title="Release-path minimum ready"
                body={
                  minimumPathReady
                    ? "GitHub and Vercel are connected, so one blocked release path can become operational."
                    : "GitHub and Vercel still need to be connected to activate the minimum release path."
                }
              />
              <ChecklistRow
                done={fullyConnected}
                title="Downstream coordination linked"
                body={
                  fullyConnected
                    ? "Linear is connected too, so launch-ticket pressure can be tied to the same incident path."
                    : "Connect Linear to include downstream ticket impact and customer-facing release pressure."
                }
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/settings/integrations"
                className="inline-flex rounded-full border border-white/12 bg-white px-4 py-2 text-sm font-medium text-[#17120f] transition hover:bg-[#f6f3ee]"
              >
                Connect integrations
              </Link>
              <Link
                href="/app"
                className="inline-flex rounded-full border border-white/18 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/6"
              >
                Open control
              </Link>
              <Link
                href="/ingestion-preview"
                className="inline-flex rounded-full border border-white/18 px-4 py-2 text-sm font-medium text-white/82 transition hover:bg-white/6 hover:text-white"
              >
                Inspect signal path
              </Link>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                What good looks like
              </p>
              <p className="mt-2 text-sm leading-7 text-white/78">
                A team signs up, connects the workspace-specific tools, sees the first blocked release path, and can answer:
                what is blocked, why it escalated, who is missing, and what should happen next.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs uppercase tracking-[0.32em] ${
          dark ? "text-white/62" : "text-amber-700/82"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-2xl font-semibold leading-tight ${
          dark ? "text-white" : "text-[#17120f]"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function OnboardingStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-[#fbfaf7] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}

function ChecklistRow({
  done,
  title,
  body,
}: {
  done: boolean;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] ${
            done
              ? "border border-emerald-300/25 bg-emerald-300/12 text-emerald-100"
              : "border border-amber-300/20 bg-amber-300/10 text-amber-100"
          }`}
        >
          {done ? "done" : "pending"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-7 text-white/72">{body}</p>
    </div>
  );
}
