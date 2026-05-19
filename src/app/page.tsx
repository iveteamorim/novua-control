import Link from "next/link";

import { getOptionalSession } from "@/lib/auth/session";

const proofPoints = [
  {
    title: "Detect what cannot ship",
    body: "Link pull requests, deploys, tickets, and rollout gates into one blocked release path.",
  },
  {
    title: "Show who has to move",
    body: "Surface the missing owner, the current release captain, and the next action before a team stalls.",
  },
  {
    title: "Keep the decision auditable",
    body: "Track the evidence, escalation rules, and incident actions that led to the current state.",
  },
];

const fitPoints = [
  "Lean product teams shipping from GitHub and Vercel without formal release coordination",
  "Founders, PMs, and eng leads who still chase blockers manually across tools",
  "One expensive workflow first: release blockers, rollback decisions, and owner gaps",
];

export default async function LandingPage() {
  const session = await getOptionalSession();

  return (
    <main className="min-h-screen bg-[#f4f1eb] text-[#151311]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[1.5rem] border border-white/10 bg-[#12100f] px-5 py-4 text-white shadow-[0_24px_70px_rgba(17,24,39,0.18)] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70">
                Novua Control
              </span>
              <span className="hidden text-sm text-white/45 sm:inline">
                Release coordination system
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/pilot"
                className="rounded-full border border-white/10 px-4 py-2 text-white/78 transition hover:bg-white/6"
              >
                Pilot
              </Link>
              {session ? (
                <Link
                  href="/app"
                  className="rounded-full bg-white px-4 py-2 font-medium text-[#151311] transition hover:bg-[#f4f1eb]"
                >
                  Open app
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="rounded-full border border-white/10 px-4 py-2 text-white/78 transition hover:bg-white/6"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-full bg-white px-4 py-2 font-medium text-[#151311] transition hover:bg-[#f4f1eb]"
                  >
                    Start workspace
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2.3rem] border border-white/8 bg-[#0f0e0d] text-white shadow-[0_30px_90px_rgba(17,24,39,0.22)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)] lg:px-10 lg:py-10 xl:px-12 xl:py-12">
            <div className="flex flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-rose-100">
                    Critical release workflows
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                    GitHub · Vercel · Linear
                  </span>
                </div>

                <h1 className="max-w-[12ch] text-5xl font-semibold leading-[0.9] tracking-[-0.07em] text-white sm:text-[5.5rem]">
                  Release coordination before release failure.
                </h1>

                <p className="max-w-3xl text-lg leading-9 text-white/64 sm:text-[1.18rem]">
                  Novua Control detects blocked release paths, shows the missing owner,
                  explains why the system escalated, and gives the team the next move
                  before a release stalls in public.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={session ? "/app" : "/sign-up"}
                    className="inline-flex rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#151311] transition hover:bg-[#f4f1eb]"
                  >
                    {session ? "Open control" : "Start workspace"}
                  </Link>
                  <a
                    href="mailto:iveteamorim@gmail.com?subject=Novua%20Control%20pilot"
                    className="inline-flex rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/6"
                  >
                    Request pilot walkthrough
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.24em]">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/65">
                  Detect coordination failure before release failure
                </span>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-amber-200">
                  Deterministic first
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,250,246,0.96),rgba(255,255,255,1))] p-5 text-[#151311] shadow-[0_26px_70px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 pb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-black/8 bg-black px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/72">
                    Novua Control
                  </span>
                  <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-rose-700">
                    Critical incident
                  </span>
                </div>
                <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Risk score 128
                </span>
              </div>

              <div className="grid gap-4 pt-5 lg:grid-cols-[1.05fr_.95fr]">
                <div className="space-y-4">
                  <h2 className="max-w-[11ch] text-4xl font-semibold leading-[0.92] tracking-[-0.06em] text-[#17120f]">
                    Checkout release blocked
                  </h2>
                  <p className="text-base leading-7 text-[#5f564e]">
                    The checkout API review has no backend owner, the production deploy
                    is blocked, and the rollout gate never cleared.
                  </p>

                  <div className="space-y-3">
                    <PreviewCard
                      title="What cannot ship?"
                      body="checkout-v2 remains blocked behind the API review and deploy gate."
                    />
                    <PreviewCard
                      title="Who should act now?"
                      body="Release captain owns the decision; backend owner is still missing."
                    />
                    <PreviewCard
                      title="Why did the system escalate this?"
                      body="Owner gap → deploy blocked → launch delayed → rollout frozen."
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-[1.5rem] border border-black/6 bg-[#f7f7f4] p-4">
                  <PreviewMetric label="Release window" value="today" />
                  <PreviewMetric label="Users affected" value="1.2k" />
                  <PreviewMetric label="Upstream delay" value="11h" />
                  <PreviewMetric label="Rollout" value="0%" critical />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {proofPoints.map((point) => (
            <article
              key={point.title}
              className="rounded-[1.7rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]"
            >
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-700/82">
                Product signal
              </p>
              <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#17120f]">
                {point.title}
              </h3>
              <p className="mt-4 text-base leading-8 text-[#615850]">{point.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-amber-700/82">
              Good fit
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#17120f]">
              Built for lean teams already shipping, but still coordinating by hand.
            </h2>
            <ul className="mt-6 space-y-3">
              {fitPoints.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-[1.15rem] border border-black/6 bg-[#f7f7f4] px-4 py-4 text-sm leading-7 text-[#615850]"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-700" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.8rem] border border-black/6 bg-[#17120f] p-6 text-white shadow-[0_24px_80px_rgba(17,24,39,0.12)]">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/58">
              Paid pilot
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
              Start with one release workflow, not a pretend self-serve platform.
            </h2>
            <p className="mt-4 text-base leading-8 text-white/72">
              Novua Control is ready as a paid pilot for teams that need clearer
              release blocker visibility across GitHub, Vercel, and Linear.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <PilotMetric label="4-week pilot" value="€2,500" />
              <PilotMetric label="Delivery" value="Manual onboarding" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pilot"
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-[#151311] transition hover:bg-[#f4f1eb]"
              >
                See pilot details
              </Link>
              <Link
                href={session ? "/app" : "/sign-up"}
                className="inline-flex rounded-full border border-white/14 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/6"
              >
                {session ? "Open control" : "Create workspace"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.1rem] border border-black/6 bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#8d8176]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#4f463e]">{body}</p>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  critical = false,
}: {
  label: string;
  value: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.15rem] border px-4 py-4 ${
        critical
          ? "border-rose-300 bg-rose-50"
          : "border-black/6 bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-[0.24em] ${
          critical ? "text-rose-700/78" : "text-[#8d8176]"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[#17120f]">
        {value}
      </p>
    </div>
  );
}

function PilotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/6 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/54">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
    </div>
  );
}
