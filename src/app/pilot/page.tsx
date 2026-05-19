import Link from "next/link";

export const metadata = {
  title: "Novua Control Pilot",
  description:
    "Enterprise onboarding for deterministic release escalation across GitHub, Vercel, Linear, and Slack.",
};

const includedItems = [
  "One release workflow configured around GitHub, Vercel, Linear, and Slack",
  "Blocked-release console with explicit owner, next action, and audit trail",
  "Custom workflow mapping with your team when self-serve setup is not enough",
  "Escalation rule tuning, Slack alert routing, and owner mapping",
];

const fitItems = [
  {
    title: "Teams shipping often",
    body: "You already have GitHub, deployments, and tickets. The problem is coordination, not missing data.",
  },
  {
    title: "Founders and EMs in the loop",
    body: "A release still depends on someone chasing owners manually when a path is blocked.",
  },
  {
    title: "One high-cost workflow first",
    body: "The pilot starts with one release train and makes that path legible before broadening scope.",
  },
];

const notFitItems = [
  "Teams looking for another AI summary inbox",
  "Organizations that need dozens of integrations before proving one release path",
  "Workflows with no clear release path, owners, or source systems yet",
];

const processSteps = [
  {
    label: "Week 1",
    title: "Map the release path",
    body: "Define one real release train, its blocking artifacts, downstream dependencies, and ownership gaps.",
  },
  {
    label: "Week 2",
    title: "Connect and normalize signals",
    body: "Bring GitHub, Vercel, Linear, and Slack signals into one incident model with explicit escalation logic.",
  },
  {
    label: "Week 3",
    title: "Run incidents through the console",
    body: "Use the system on live blockers, validate the alert path, and tune ownership and state transitions.",
  },
  {
    label: "Week 4",
    title: "Review operational lift",
    body: "Assess what became clearer, what actions were faster, and whether the pilot should continue or expand.",
  },
];

export default function PilotPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#151311]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-black/6 bg-[linear-gradient(135deg,rgba(255,247,239,0.98),rgba(255,255,255,1)_45%)] p-5 shadow-[0_24px_80px_rgba(17,24,39,0.05)] sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7e746b]">
                  Novua Control
                </span>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-amber-700">
                  Enterprise pilot
                </span>
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#17120f] sm:text-[3.25rem]">
                Enterprise onboarding for teams whose release paths are too expensive to coordinate by hand.
              </h1>

              <p className="max-w-3xl text-base leading-8 text-[#5f564e] sm:text-lg">
                Novua Control starts self-serve, but the enterprise pilot helps teams
                formalize one critical release workflow: what cannot ship, who is
                missing, and what must happen next before the path blocks.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/app"
                  className="inline-flex rounded-full border border-black/8 bg-black px-4 py-2 text-sm font-medium text-white transition hover:border-black hover:bg-[#17120f]"
                >
                  Open console
                </Link>
                <a
                  href="mailto:contact@novua.digital?subject=Novua%20Control%20enterprise%20pilot"
                  className="inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#17120f] transition hover:border-black/15 hover:bg-white"
                >
                  Request enterprise pilot
                </a>
              </div>
            </div>

            <div className="space-y-3 xl:min-w-[430px]">
              <div className="rounded-[1.6rem] border border-black/6 bg-[#17120f] p-4 text-white shadow-[0_24px_60px_rgba(17,24,39,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/52">
                      Pilot snapshot
                    </p>
                    <h2 className="mt-2 text-lg font-semibold leading-tight">
                      Checkout release blocked
                    </h2>
                  </div>
                  <span className="rounded-full border border-rose-400/35 bg-rose-500/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-rose-100">
                    critical
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <PreviewRow
                    label="Missing owner"
                    value="Backend approval still unassigned"
                  />
                  <PreviewRow
                    label="Next move"
                    value="Assign backend owner or remove checkout-v2 from today's release."
                  />
                  <PreviewRow
                    label="Evidence"
                    value="GitHub review waiting · Vercel deploy blocked · Linear launch ticket delayed"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PreviewBadge label="GitHub live" tone="warm" />
                  <PreviewBadge label="Vercel live" tone="warm" />
                  <PreviewBadge label="Linear seeded" tone="neutral" />
                </div>
              </div>

              <div className="grid items-start gap-3 rounded-[1.6rem] border border-black/6 bg-[#f7f7f4] p-4 sm:grid-cols-2">
                <PilotFact label="Pilot length" value="2-4 weeks" />
                <PilotFact label="Scope" value="1 release train" />
                <PilotFact label="Integrations" value="GitHub + Vercel + Linear + Slack" />
                <PilotFact label="Delivery" value="Workflow onboarding" />
              </div>
            </div>
          </div>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="What the pilot solves"
              title="The release is blocked, but nobody can answer four questions fast enough."
            />

            <div className="mt-5 grid gap-3">
              <ProblemCard
                title="What is blocked?"
                body="The exact release path, not just a failing deploy or a stale PR viewed in isolation."
              />
              <ProblemCard
                title="Why is it blocked?"
                body="The dependency chain that made the incident real enough to escalate."
              />
              <ProblemCard
                title="Who has to act?"
                body="The missing or current owner on the blocking path, not a vague alert channel."
              />
              <ProblemCard
                title="What should happen next?"
                body="The next operational move, with a trace of how the system got there."
              />
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-amber-300/45 bg-[linear-gradient(180deg,rgba(255,250,239,0.96),rgba(255,255,255,1)_26%)] p-5 shadow-[0_20px_56px_rgba(120,84,28,0.08)]">
            <SectionHeader
              eyebrow="Pilot offer"
              title="Premium onboarding for workflows that need governance, reusable rules, and rollout support."
            />

            <div className="mt-5 rounded-[1.4rem] border border-amber-300/75 bg-[#fff1ca] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700/82">
                What is included
              </p>
              <ul className="mt-4 space-y-3">
                {includedItems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-[#4c4138]">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 grid items-start gap-3 sm:grid-cols-2">
              <PriceCard label="Team plan" value="€199/mo" />
              <PriceCard label="Enterprise onboarding" value="€1,500–€5,000" />
            </div>
          </section>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Good fit"
              title="Who this is for"
            />

            <div className="mt-5 grid gap-3">
              {fitItems.map((item) => (
                <FitCard key={item.title} title={item.title} body={item.body} />
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-black/6 bg-[#fbfaf8] p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
            <SectionHeader
              eyebrow="Not for"
              title="Where this would be the wrong product"
            />

            <ul className="mt-5 space-y-3">
              {notFitItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-[1rem] border border-black/6 bg-white px-4 py-3 text-sm leading-7 text-[#615850]"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8d8176]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_48px_rgba(17,24,39,0.04)]">
          <SectionHeader
            eyebrow="Pilot flow"
            title="What happens over four weeks"
          />

          <div className="mt-5 grid items-start gap-3 xl:grid-cols-4">
            {processSteps.map((step) => (
              <div
                key={step.label}
                className="rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">
                  {step.label}
                </p>
                <h3 className="mt-2 text-base font-semibold text-[#17120f]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#615850]">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-black/6 bg-[#17120f] p-5 text-white shadow-[0_24px_80px_rgba(17,24,39,0.08)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-white/62">
                Next step
              </p>
              <h2 className="text-3xl font-semibold leading-tight">
                If one release path is expensive enough to justify governance, the enterprise pilot is the right entry point.
              </h2>
              <p className="text-sm leading-7 text-white/72">
                Start self-serve for the standard path. Bring us in when the release
                model, owners, and escalation rules need to become reusable across a team.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:contact@novua.digital?subject=Novua%20Control%20enterprise%20pilot"
                className="inline-flex rounded-full border border-white/18 bg-white px-4 py-2 text-sm font-medium text-[#17120f] transition hover:bg-[#f6f3ee]"
              >
                Book a walkthrough
              </a>
              <Link
                href="/sign-up"
                className="inline-flex rounded-full border border-white/18 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/6"
              >
                Start workspace
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.32em] text-amber-700/82">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17120f]">
        {title}
      </h2>
    </div>
  );
}

function PilotFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[#8d8176]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}

function ProblemCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4">
      <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#615850]">{body}</p>
    </div>
  );
}

function FitCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/6 bg-[#f7f7f4] p-4">
      <h3 className="text-base font-semibold text-[#17120f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#615850]">{body}</p>
    </div>
  );
}

function PriceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/6 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[#93867b]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#17120f]">{value}</p>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/4 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/88">{value}</p>
    </div>
  );
}

function PreviewBadge({
  label,
  tone,
}: {
  label: string;
  tone: "warm" | "neutral";
}) {
  const toneClass =
    tone === "warm"
      ? "border-amber-300/20 bg-amber-200/10 text-amber-50"
      : "border-white/10 bg-white/5 text-white/72";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] ${toneClass}`}
    >
      {label}
    </span>
  );
}
