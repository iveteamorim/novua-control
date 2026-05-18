import Link from "next/link";

import { signUpAction } from "@/app/auth/actions";
import { LegalLinks } from "@/components/legal-links";
import { NovuaMark } from "@/components/novua-mark";
import { getOptionalSession } from "@/lib/auth/session";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getOptionalSession();

  if (session) {
    return (
      <main className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-[#151311]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)]">
          <p className="text-sm text-[#5f564e]">You already have an active session.</p>
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
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)]">
          <NovuaMark href="/" />
          <p className="text-xs font-medium uppercase tracking-[0.36em] text-amber-700">
            <span className="mt-6 inline-block">Create workspace</span>
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#17120f]">
            Start your control layer
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f564e]">
            Create an account, name your workspace, and get a protected release
            coordination console instead of a public demo.
          </p>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)]">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#17120f]">
            Create account
          </h2>
          {params.error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
          <form action={signUpAction} className="mt-6 space-y-4">
            <Field label="Display name" name="displayName" type="text" />
            <Field label="Workspace name" name="workspaceName" type="text" />
            <Field label="Email" name="email" type="email" />
            <Field label="Password" name="password" type="password" />
            <label className="flex items-start gap-3 rounded-2xl border border-black/6 bg-[#fbfaf7] px-4 py-4">
              <input
                type="checkbox"
                name="acceptedTerms"
                required
                className="mt-1 h-4 w-4 rounded border-black/20"
              />
              <LegalLinks compact />
            </label>
            <button className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
              Create account
            </button>
          </form>
          <p className="mt-5 text-sm text-[#5f564e]">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-[#17120f] underline">
              Sign in
            </Link>
          </p>
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
