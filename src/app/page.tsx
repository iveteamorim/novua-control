import Link from "next/link";

import { NovuaMark } from "@/components/novua-mark";
import { getOptionalSession } from "@/lib/auth/session";

const heroMeta = [
  "GitHub + Vercel + Linear",
  "Deterministic escalation logic",
  "Audit trail included",
];

const incidentStats = [
  { label: "Risk score", value: "128" },
  { label: "Users affected", value: "1.2k" },
  { label: "Time blocked", value: "11h" },
  { label: "State", value: "Mitigating" },
];

const controlCards = [
  {
    eyebrow: "Dependency chains",
    title: "Link blockers across systems",
    body: "Control connects pull requests, deployments, rollout gates, and customer-facing tickets into one release path.",
  },
  {
    eyebrow: "Ownership gaps",
    title: "Surface who must act now",
    body: "Missing owners, stale reviews, and blocked deploys escalate automatically before incidents spread downstream.",
  },
  {
    eyebrow: "Audit trail",
    title: "Preserve operational context",
    body: "Every escalation, mitigation, and state transition remains visible inside one incident timeline.",
  },
];

const processSteps = [
  {
    step: "1",
    title: "Webhook arrives",
    body: "GitHub, Vercel, and Linear emit deployment, PR, and workflow events.",
  },
  {
    step: "2",
    title: "Signals extracted",
    body: "Control normalizes ownership gaps, stale reviews, blocked deploys, and release dependencies.",
  },
  {
    step: "3",
    title: "Escalation logic",
    body: "Deterministic rules score operational risk and trigger incident escalation.",
  },
  {
    step: "4",
    title: "Action path",
    body: "Teams receive explicit next actions instead of fragmented logs across tools.",
  },
];

const pilotIncludes = [
  "GitHub + Vercel + Linear connection",
  "One operational release workflow",
  "Incident console + escalation logic",
  "Audit trail + action flow",
  "2–4 weeks onboarding support",
];

export default async function LandingPage() {
  const session = await getOptionalSession();
  const traceHref = session ? "/app" : "/sign-in";
  const startHref = session ? "/app" : "/sign-up";

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#111]">
      <header className="py-7">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-6 px-4 sm:px-6">
          <NovuaMark href="/" compact />

          <nav className="hidden items-center gap-[34px] text-[0.95rem] text-[#57534e] md:flex">
            <a href="#product" className="transition hover:text-[#111]">
              Product
            </a>
            <a href="#workflow" className="transition hover:text-[#111]">
              Workflow
            </a>
            <a href="#pilot" className="transition hover:text-[#111]">
              Pilot
            </a>
            <a
              href="mailto:iveteamorim@gmail.com?subject=Novua%20Control"
              className="transition hover:text-[#111]"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      <section className="pb-[90px] pt-[60px]">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="mb-[22px] text-[0.75rem] uppercase tracking-[0.28em] text-[#c56d1d]">
              Release coordination layer
            </p>

            <h1 className="mb-7 max-w-[720px] text-[3rem] font-extrabold leading-[0.92] tracking-[-0.06em] text-[#111] sm:text-[4rem] lg:text-[5.2rem]">
              Release blockers should not stay invisible.
            </h1>

            <p className="mb-9 max-w-[680px] text-[1.2rem] leading-9 text-[#5e5a56]">
              Novua Control connects GitHub, Vercel, and Linear into one
              operational release layer. It detects blocked execution paths,
              missing owners, and escalation risk before launches stall across
              teams.
            </p>

            <div className="mb-7 flex flex-wrap gap-4">
              <a
                href="mailto:iveteamorim@gmail.com?subject=Novua%20Control%20pilot"
                className="rounded-full bg-[#111] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-px"
              >
                Request pilot
              </a>

              <Link
                href={traceHref}
                className="rounded-full border border-[#d8d1c8] px-6 py-4 text-sm font-semibold text-[#111] transition hover:-translate-y-px"
              >
                View incident trace
              </Link>
            </div>

            <div className="flex flex-wrap gap-[14px]">
              {heroMeta.map((item) => (
                <MetaPill key={item} label={item} />
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-[#eadfd4] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
            <div className="mb-[22px] inline-flex items-center gap-2 rounded-full border border-[#f0b5b5] bg-[#fff8f8] px-4 py-2 text-[0.82rem] text-[#d03434]">
              <span className="h-2 w-2 rounded-full bg-[#e53935]" />
              CRITICAL INCIDENT
            </div>

            <h2 className="mb-[18px] text-[2rem] leading-none tracking-[-0.05em] text-[#111] sm:text-[2.6rem]">
              Checkout release blocked
            </h2>

            <p className="mb-[26px] text-base text-[#625d58]">
              API review has no clear owner, the production deploy is blocked,
              and customer-facing launch work cannot ship.
            </p>

            <div className="mb-[22px] grid grid-cols-2 gap-[14px]">
              {incidentStats.map((stat) => (
                <IncidentStat
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={startHref}
                className="rounded-full bg-[#111] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px"
              >
                Assign backend owner
              </Link>

              <Link
                href={traceHref}
                className="rounded-full border border-[#d8d1c8] px-5 py-3 text-sm font-semibold text-[#111] transition hover:-translate-y-px"
              >
                Open trace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="py-[90px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          <p className="mb-[22px] text-[0.75rem] uppercase tracking-[0.28em] text-[#c56d1d]">
            What control does
          </p>

          <h2 className="mb-[18px] text-[2.2rem] leading-none tracking-[-0.05em] text-[#111] sm:text-[3rem]">
            Operational visibility for release execution.
          </h2>

          <p className="mb-[50px] max-w-[760px] text-[1.1rem] text-[#655f5a]">
            Most tools expose events. Control links them into execution paths,
            ownership chains, and operational decisions.
          </p>

          <div className="grid gap-6 lg:grid-cols-3">
            {controlCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] border border-[#e7ddd2] bg-white p-7"
              >
                <p className="mb-[18px] text-[0.72rem] uppercase tracking-[0.22em] text-[#c56d1d]">
                  {card.eyebrow}
                </p>
                <h3 className="mb-4 text-2xl leading-[1.1] text-[#111]">
                  {card.title}
                </h3>
                <p className="text-[#655f5a]">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="py-[90px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          <p className="mb-[22px] text-[0.75rem] uppercase tracking-[0.28em] text-[#c56d1d]">
            How it works
          </p>

          <h2 className="mb-[18px] text-[2.2rem] leading-none tracking-[-0.05em] text-[#111] sm:text-[3rem]">
            From webhook to operational action.
          </h2>

          <p className="mb-[50px] max-w-[760px] text-[1.1rem] text-[#655f5a]">
            Control transforms raw engineering events into deterministic
            operational signals.
          </p>

          <div className="grid gap-5 lg:grid-cols-4">
            {processSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-[26px] border border-[#e7ddd2] bg-white p-6"
              >
                <div className="mb-[22px] grid h-[42px] w-[42px] place-items-center rounded-full bg-[#f3ece4] text-sm font-bold text-[#111]">
                  {step.step}
                </div>
                <h3 className="text-xl text-[#111]">{step.title}</h3>
                <p className="mt-3 text-[#655f5a]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pilot" className="py-[90px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          <div className="grid items-center gap-10 rounded-[34px] border border-[#eadfd4] bg-white p-[42px] lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-[22px] text-[0.75rem] uppercase tracking-[0.28em] text-[#c56d1d]">
                Paid pilot
              </p>

              <h2 className="mb-[18px] text-[2.2rem] leading-none tracking-[-0.05em] text-[#111] sm:text-[3rem]">
                Launch with a real workflow.
              </h2>

              <p className="max-w-[760px] text-[1.1rem] text-[#655f5a]">
                Novua Control is currently onboarded directly with each team.
                The pilot includes workflow configuration, integrations, and
                release-path setup.
              </p>

              <ul className="mt-[22px] list-disc space-y-3 pl-[18px] text-[#625d58]">
                {pilotIncludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="min-w-[220px]">
              <p className="text-[4.5rem] leading-none tracking-[-0.08em] text-[#111]">
                €2,500
              </p>
              <p className="mt-3 text-[#6a655f]">fixed pilot engagement</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 text-[0.92rem] text-[#7b746d]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          Novua Control — Operational release coordination layer for modern
          software teams.
        </div>
      </footer>
    </main>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#e5ddd3] bg-white px-4 py-2 text-[0.92rem] text-[#5e5a56]">
      {label}
    </span>
  );
}

function IncidentStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#eee4da] bg-[#faf8f5] p-[18px]">
      <p className="mb-[10px] text-[0.7rem] uppercase tracking-[0.2em] text-[#9a948d]">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[#111]">{value}</p>
    </div>
  );
}
