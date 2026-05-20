import type { ReactNode } from "react";

import { disconnectWorkspaceIntegrationAction, saveWorkspaceIntegrationAction } from "@/app/settings/actions";
import { SessionBar } from "@/components/session-bar";
import { getWorkspaceContext } from "@/lib/auth/accounts";
import { requireWorkspaceSession } from "@/lib/auth/session";
import { getWorkspaceIntegrationMap } from "@/lib/control/store";
import type { SourceSystem, WorkspaceIntegrationRecord } from "@/lib/control/types";
import { oauthConfigured } from "@/lib/oauth/workspace-oauth";

function maskSecret(value?: string | null) {
  if (!value) {
    return "Not saved";
  }

  if (value.length <= 8) {
    return "Saved";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function getStatusTone(status?: WorkspaceIntegrationRecord["status"]) {
  if (status === "connected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "degraded") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-600";
}

function isValidGitHubRepository(repository?: string | null) {
  return Boolean(repository && /^[^@\s/]+\/[^@\s/]+$/.test(repository));
}

function getGitHubStatus(existing: WorkspaceIntegrationRecord | undefined) {
  if (existing?.provider !== "github") {
    return existing?.status;
  }

  if (existing.status === "connected" && !isValidGitHubRepository(existing.repository)) {
    return "degraded";
  }

  return existing.status;
}

type IntegrationCardProps = {
  provider: SourceSystem;
  title: string;
  description: string;
  statusLabel: string;
  status?: WorkspaceIntegrationRecord["status"];
  children: ReactNode;
  existing: WorkspaceIntegrationRecord | undefined;
  oauthEnabled: boolean;
};

function IntegrationCard({
  provider,
  title,
  description,
  statusLabel,
  status,
  children,
  existing,
  oauthEnabled,
}: IntegrationCardProps) {
  const oauthHref = `/api/oauth/${provider}/start`;

  return (
    <section className="rounded-[1.7rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#8a7d73]">
            {provider}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17120f]">
            {title}
          </h2>
          <p className="mt-3 text-base leading-7 text-[#615850]">
            {description}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] ${getStatusTone(status ?? existing?.status)}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/6 bg-[#fbfaf7] px-4 py-4">
        <a
          href={oauthEnabled ? oauthHref : undefined}
          aria-disabled={!oauthEnabled}
          className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
            oauthEnabled
              ? "bg-black text-white hover:bg-[#17120f]"
              : "cursor-not-allowed border border-black/8 bg-white text-[#8d8176]"
          }`}
        >
          Connect with {title}
        </a>
        <p className="text-sm text-[#615850]">
          {oauthEnabled
            ? `OAuth stores the ${title} token server-side and auto-selects the first valid resource.`
            : `${title} OAuth is not configured on this deployment yet.`}
        </p>
      </div>

      <form action={saveWorkspaceIntegrationAction} className="mt-4 space-y-4">
        <input type="hidden" name="provider" value={provider} />
        <label className="flex items-center gap-3 rounded-2xl border border-black/6 bg-[#fbfaf7] px-4 py-3 text-sm text-[#3f3731]">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={existing?.enabled ?? true}
            className="h-4 w-4 accent-black"
          />
          Use a workspace-specific {title.toLowerCase()} connection
        </label>

        {children}

        <div className="flex flex-wrap gap-3 pt-2">
          <button className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
            Save integration
          </button>
          {existing ? (
            <button
              formAction={disconnectWorkspaceIntegrationAction}
              className="inline-flex rounded-full border border-black/8 px-5 py-3 text-sm font-medium text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white"
            >
              Remove integration
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

export default async function IntegrationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireWorkspaceSession("/settings/integrations");
  const [context, integrationMap, params] = await Promise.all([
    getWorkspaceContext(session.userId, session.workspaceId),
    getWorkspaceIntegrationMap(session.workspaceId),
    searchParams,
  ]);

  const github = integrationMap.github;
  const vercel = integrationMap.vercel;
  const linear = integrationMap.linear;
  const githubOauthEnabled = oauthConfigured("github");
  const vercelOauthEnabled = oauthConfigured("vercel");
  const linearOauthEnabled = oauthConfigured("linear");

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-4 py-5 text-[#151311] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6">
        <SessionBar session={session} />

        <header className="rounded-[2rem] border border-black/6 bg-white px-6 py-7 shadow-[0_24px_80px_rgba(17,24,39,0.05)] sm:px-8 sm:py-9">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-amber-700">
            Workspace integrations
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#17120f]">
            Connect each workspace to its own tools
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#615850]">
            {context?.workspace?.name ?? "This workspace"} can override the demo
            installation and run GitHub, Vercel, and Linear with its own
            credentials. Tokens stay server-side in the workspace store.
          </p>
          {params.success ? (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {decodeURIComponent(params.success)}
            </p>
          ) : null}
          {params.error ? (
            <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
        </header>

        <div className="grid gap-6">
          <IntegrationCard
            provider="github"
            title="GitHub"
            description="Used for pull requests, reviewer ownership, stale reviews, and release-path dependency signals."
            statusLabel={getGitHubStatus(github) ?? "not configured"}
            status={getGitHubStatus(github)}
            existing={github}
            oauthEnabled={githubOauthEnabled}
          >
            {github?.provider === "github" && github.accountLogin ? (
              <ConnectedSummary
                label="Connected account"
                value={`@${github.accountLogin}`}
                detail={github.repository || "Repository not selected yet"}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Repository
                </span>
                <input
                  name="githubRepository"
                  defaultValue={
                    github?.provider === "github" && isValidGitHubRepository(github.repository)
                      ? github.repository
                      : ""
                  }
                  placeholder="owner/repo"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
                <p className="text-xs text-[#7e746b]">
                  Use the GitHub repository slug, for example <span className="font-mono">owner/repo</span>.
                </p>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Access token
                </span>
                <input
                  name="githubToken"
                  type="password"
                  placeholder={maskSecret(
                    github?.provider === "github" ? github.token : null,
                  )}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
                <p className="text-xs text-[#7e746b]">
                  Leave blank to keep the current token.
                </p>
              </label>
            </div>
          </IntegrationCard>

          <IntegrationCard
            provider="vercel"
            title="Vercel"
            description="Used for deployment failures, rollout gates, retry pressure, and release-environment status."
            statusLabel={vercel?.status ?? "not configured"}
            existing={vercel}
            oauthEnabled={vercelOauthEnabled}
          >
            {vercel?.provider === "vercel" && (vercel.accountName || vercel.projectName) ? (
              <ConnectedSummary
                label="Connected account"
                value={vercel.accountName || "Vercel account"}
                detail={vercel.projectName || vercel.projectId || "Project not selected yet"}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Project ID
                </span>
                <input
                  name="vercelProjectId"
                  defaultValue={vercel?.provider === "vercel" ? vercel.projectId : ""}
                  placeholder="prj_..."
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Team ID
                </span>
                <input
                  name="vercelTeamId"
                  defaultValue={vercel?.provider === "vercel" ? (vercel.teamId ?? "") : ""}
                  placeholder="team_... (optional)"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
              </label>
              <label className="block space-y-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Access token
                </span>
                <input
                  name="vercelToken"
                  type="password"
                  placeholder={maskSecret(
                    vercel?.provider === "vercel" ? vercel.token : null,
                  )}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
                <p className="text-xs text-[#7e746b]">
                  Leave blank to keep the current token.
                </p>
              </label>
            </div>
          </IntegrationCard>

          <IntegrationCard
            provider="linear"
            title="Linear"
            description="Used for issue ownership, blocked launch tickets, and downstream release coordination pressure."
            statusLabel={linear?.status ?? "not configured"}
            existing={linear}
            oauthEnabled={linearOauthEnabled}
          >
            {linear?.provider === "linear" && (linear.accountName || linear.teamName) ? (
              <ConnectedSummary
                label="Connected account"
                value={linear.accountName || "Linear account"}
                detail={linear.teamName || linear.teamKey || "Team not selected yet"}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Team key
                </span>
                <input
                  name="linearTeamKey"
                  defaultValue={linear?.provider === "linear" ? linear.teamKey : ""}
                  placeholder="ENG"
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  API key
                </span>
                <input
                  name="linearApiKey"
                  type="password"
                  placeholder={maskSecret(
                    linear?.provider === "linear" ? linear.apiKey : null,
                  )}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
                />
                <p className="text-xs text-[#7e746b]">
                  Leave blank to keep the current API key.
                </p>
              </label>
            </div>
          </IntegrationCard>
        </div>
      </div>
    </main>
  );
}

function ConnectedSummary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-black/6 bg-[#f7f7f4] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#17120f]">{value}</p>
      <p className="mt-1 text-sm text-[#615850]">{detail}</p>
    </div>
  );
}
