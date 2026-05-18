import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { getWorkspaceContext } from "@/lib/auth/accounts";
import type { AuthSession } from "@/lib/auth/session";

export async function SessionBar({ session }: { session: AuthSession }) {
  const context = await getWorkspaceContext(session.userId, session.workspaceId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-black/6 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
          Workspace
        </p>
        <p className="truncate text-sm font-medium text-[#17120f]">
          {context?.workspace?.name ?? "Workspace setup pending"}
          <span className="ml-2 text-[#7e746b]">· {session.displayName}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/settings/integrations"
          className="inline-flex rounded-full border border-black/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#6f645b] transition hover:border-black/15 hover:bg-[#f7f7f4]"
        >
          Integrations
        </Link>
        <form action={signOutAction}>
          <button className="inline-flex rounded-full border border-black/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#6f645b] transition hover:border-black/15 hover:bg-black hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
