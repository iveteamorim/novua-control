import Link from "next/link";

import { NovuaMark } from "@/components/novua-mark";

export function LegalPageFrame({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-[#151311]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <NovuaMark href="/" compact />
          <Link
            href="/sign-up"
            className="inline-flex rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-medium text-[#17120f]"
          >
            Back to sign up
          </Link>
        </div>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_24px_80px_rgba(17,24,39,0.06)] sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.36em] text-amber-700">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#17120f] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#5f564e]">
            {summary}
          </p>

          <div className="mt-10 space-y-8 text-[#3f352d]">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#17120f]">
        {title}
      </h2>
      <div className="space-y-3 text-base leading-8 text-[#4f463f]">{children}</div>
    </section>
  );
}
