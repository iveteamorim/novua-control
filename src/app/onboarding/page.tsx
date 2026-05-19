import { createWorkspaceAction } from "@/app/auth/actions";
import { getWorkspaceContext } from "@/lib/auth/accounts";
import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession("/onboarding");
  const context = await getWorkspaceContext(session.userId, session.workspaceId);

  if (context?.workspace) {
    redirect("/app");
  }

  const params = await searchParams;

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
