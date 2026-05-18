import Link from "next/link";

import { signInAction } from "@/app/auth/actions";
import { LegalLinks } from "@/components/legal-links";
import { NovuaMark } from "@/components/novua-mark";
import { getOptionalSession } from "@/lib/auth/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await getOptionalSession();

  if (session) {
    return (
      <main className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-[#151311]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)]">
          <p className="text-sm text-[#5f564e]">You are already signed in.</p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Go to control
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-[#151311]">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)]">
          <NovuaMark href="/" />
          <p className="text-xs font-medium uppercase tracking-[0.36em] text-amber-700">
            <span className="mt-6 inline-block">Novua Control</span>
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#17120f]">
            Sign in to your workspace
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f564e]">
            Access release blockers, audit history, and workspace-scoped incident
            actions from one console.
          </p>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#17120f]">
            Sign in
          </h2>
          {params.error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
          <form action={signInAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={params.next ?? "/"} />
            <Field label="Email" name="email" type="email" />
            <Field label="Password" name="password" type="password" />
            <button className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
              Sign in
            </button>
          </form>
          <p className="mt-5 text-sm text-[#5f564e]">
            No account yet?{" "}
            <Link href="/sign-up" className="font-medium text-[#17120f] underline">
              Create one
            </Link>
          </p>
          <div className="mt-5 border-t border-black/6 pt-5">
            <LegalLinks />
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type,
}: {
  label: string;
  name: string;
  type: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#7e746b]">
        {label}
      </span>
      <input
        className="w-full rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-base outline-none transition focus:border-black/20"
        type={type}
        name={name}
        required
      />
    </label>
  );
}
