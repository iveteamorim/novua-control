import Link from "next/link";
import type { ReactNode } from "react";

import { getOptionalSession } from "@/lib/auth/session";

const signals = [
  { label: "GitHub", text: "PR stale", icon: <IconGitHub /> },
  { label: "Vercel", text: "Deploy failed", icon: <IconRocket /> },
  { label: "Linear", text: "Ticket blocked", icon: <IconList /> },
];

const timeline = [
  ["19:04", "Webhook received", "github.pull_request"],
  ["19:05", "Owner missing", "signal.generated"],
  ["19:07", "Deploy blocked", "vercel.error"],
  ["19:10", "Incident escalated", "risk.score 128"],
];

const landingChecks = [
  { name: "signals", pass: signals.length === 3 },
  { name: "timeline", pass: timeline.length === 4 },
  { name: "pilot price", pass: "EUR 2,500".includes("2,500") },
];

export default async function LandingPage() {
  const session = await getOptionalSession();
  const productHref = session ? "/app" : "/sign-in";

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090a] text-white">
      <Nav sessionHref={productHref} sessionLabel={session ? "Open app" : "Sign in"} />

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 lg:px-8 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(217,119,43,0.22),transparent_34%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="absolute left-1/2 top-28 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#18130f] blur-3xl" />

        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/60 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#d77b2f]" />
            Release coordination layer for GitHub, Vercel and Linear
          </div>

          <h1 className="text-balance text-6xl font-medium leading-[0.92] tracking-[-0.07em] md:text-8xl lg:text-[112px]">
            Release blockers should not stay invisible.
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/58 md:text-xl">
            Novua Control turns scattered engineering events into operational
            signals, ownership decisions and auditable release paths.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:iveteamorim@gmail.com?subject=Novua%20Control%20pilot"
              className="rounded-full bg-white px-6 py-3 font-medium text-black shadow-[0_0_40px_rgba(255,255,255,0.16)]"
            >
              Request paid pilot
            </a>
            <Link
              href={productHref}
              className="rounded-full border border-white/12 bg-white/[.04] px-6 py-3 font-medium text-white/82"
            >
              View product trace
            </Link>
          </div>
        </div>

        <HeroProductVisual />
      </section>

      <LogoStrip />
      <ProblemVisual />
      <SignalEngine />
      <PilotSection />
    </main>
  );
}

function Nav({
  sessionHref,
  sessionLabel,
}: {
  sessionHref: string;
  sessionLabel: string;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[.06] bg-[#08090a]/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/38">
              Novua
            </div>
            <div className="text-lg font-semibold tracking-[-0.04em]">
              Control
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#pilot">Pilot</a>
          <a href="mailto:iveteamorim@gmail.com?subject=Novua%20Control">
            Contact
          </a>
        </div>

        <Link
          href={sessionHref}
          className="rounded-full border border-white/12 bg-white/[.04] px-4 py-2 text-sm font-medium text-white/82"
        >
          {sessionLabel}
        </Link>
      </nav>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.05]">
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
      >
        <path d="M7 7h6v6H7V7Z" fill="#fff" />
        <path d="M13 13h6v6h-6v-6Z" fill="#fff" />
        <path d="M13 7h6v6h-6V7Z" fill="#d77b2f" />
        <path
          d="M10 10h6M16 10v6M10 10v6h6"
          stroke="#08090a"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function HeroProductVisual() {
  return (
    <div className="relative mx-auto mt-20 max-w-6xl">
      <div className="absolute -inset-x-16 top-20 h-64 rounded-full bg-[#d77b2f]/10 blur-3xl" />

      <div className="relative rounded-[2rem] border border-white/10 bg-[#121314] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs text-white/44">
            control.novua/release/checkout-v2
          </div>
          <div className="text-xs text-white/35">live</div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[250px_1fr]">
          <aside className="hidden border-r border-white/[.07] p-5 lg:block">
            <div className="mb-6 rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                Workspace
              </div>
              <div className="mt-2 font-medium">Launch Ops</div>
            </div>
            <SideItem active icon={<IconAlert />} label="Escalations" value="2" />
            <SideItem icon={<IconBranch />} label="Release paths" value="5" />
            <SideItem icon={<IconActivity />} label="Signals" value="24" />
            <SideItem icon={<IconClock />} label="Audit trail" value="18" />
          </aside>

          <div className="p-5 md:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-[1.7rem] border border-[#d77b2f]/25 bg-[#1a1511] p-6">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d77b2f]/30 bg-[#d77b2f]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#f0a768]">
                  <span className="h-2 w-2 rounded-full bg-[#d77b2f]" />{" "}
                  critical incident
                </div>
                <h2 className="text-4xl font-medium leading-none tracking-[-0.05em] md:text-5xl">
                  Checkout release blocked
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-white/55">
                  API review has no clear owner, production deploy is blocked,
                  and customer-facing launch work cannot ship.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MiniMetric label="risk" value="128" />
                  <MiniMetric label="blocked" value="11h" />
                  <MiniMetric label="artifacts" value="5" />
                  <MiniMetric label="state" value="mitigating" />
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/[.08] bg-white/[.035] p-6">
                <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                  Next action
                </div>
                <p className="mt-4 text-2xl font-medium leading-tight tracking-[-0.04em]">
                  Assign backend owner or remove checkout-v2 from today’s
                  release.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Assign owner <IconArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
              <div className="rounded-[1.7rem] border border-white/[.08] bg-white/[.035] p-6">
                <div className="mb-5 text-xs uppercase tracking-[0.28em] text-white/35">
                  Signal path
                </div>
                <Pipeline />
              </div>

              <div className="rounded-[1.7rem] border border-white/[.08] bg-white/[.035] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.28em] text-white/35">
                    Audit trail
                  </div>
                  <div className="text-xs text-white/35">18 entries</div>
                </div>
                <div className="space-y-3">
                  {timeline.map(([time, title, note]) => (
                    <div
                      key={title}
                      className="grid grid-cols-[58px_1fr] gap-3 rounded-2xl border border-white/[.06] bg-black/20 p-3"
                    >
                      <div className="font-mono text-xs text-white/32">
                        {time}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{title}</div>
                        <div className="mt-1 font-mono text-xs text-white/35">
                          {note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 hidden text-center text-[11px] uppercase tracking-[0.24em] text-white/25 md:block">
        visual prototype checks:{" "}
        {landingChecks.every((check) => check.pass)
          ? "passed"
          : "review needed"}
      </div>
    </div>
  );
}

function SideItem({
  icon,
  label,
  value,
  active,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`mb-2 flex items-center justify-between rounded-2xl px-3 py-3 text-sm ${
        active ? "bg-white/[.08] text-white" : "text-white/45"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-xs text-white/35">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/30">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-[-0.03em]">
        {value}
      </div>
    </div>
  );
}

function Pipeline() {
  return (
    <div className="space-y-4">
      {signals.map((signal, idx) => (
        <div key={signal.label}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-black/20 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] text-[#d77b2f]">
              {signal.icon}
            </div>
            <div>
              <div className="text-sm font-medium">{signal.label}</div>
              <div className="mt-1 text-xs text-white/38">{signal.text}</div>
            </div>
          </div>
          {idx < signals.length - 1 && <div className="ml-8 h-5 w-px bg-white/12" />}
        </div>
      ))}
    </div>
  );
}

function LogoStrip() {
  return (
    <section className="border-y border-white/[.06] bg-white/[.02] py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-6 text-sm text-white/42 lg:px-8">
        <span className="mr-3 text-white/28">Designed to sit above</span>
        <Pill>GitHub</Pill>
        <Pill>Vercel</Pill>
        <Pill>Linear</Pill>
        <Pill>Slack</Pill>
        <Pill>CI/CD</Pill>
      </div>
    </section>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/[.08] bg-white/[.035] px-4 py-2">
      {children}
    </span>
  );
}

function ProblemVisual() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-28 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
      <div>
        <div className="mb-5 text-xs uppercase tracking-[0.32em] text-[#d77b2f]">
          The gap
        </div>
        <h2 className="text-5xl font-medium leading-[0.96] tracking-[-0.06em] md:text-7xl">
          The data exists. The coordination does not.
        </h2>
        <p className="mt-7 max-w-lg text-lg leading-8 text-white/55">
          Each tool knows one part of the failure. Control links them into a
          release path, detects the ownership gap, and creates a stateful
          incident.
        </p>
      </div>

      <div className="relative min-h-[520px] rounded-[2rem] border border-white/[.08] bg-[#111213] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,119,43,0.14),transparent_42%)]" />
        <Node className="left-[8%] top-[12%]" title="GitHub" subtitle="PR #42 stale" />
        <Node className="right-[10%] top-[18%]" title="Vercel" subtitle="deploy failed" />
        <Node className="bottom-[15%] left-[15%]" title="Linear" subtitle="ticket blocked" />
        <Node className="bottom-[12%] right-[14%]" title="Rollout" subtitle="0% released" />
        <div className="absolute left-1/2 top-1/2 z-20 grid h-44 w-44 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#d77b2f]/35 bg-[#d77b2f]/10 shadow-[0_0_80px_rgba(217,119,43,0.18)]">
          <div className="text-center">
            <IconAlert className="mx-auto mb-3 text-[#d77b2f]" />
            <div className="text-xl font-medium tracking-[-0.04em]">
              Release path blocked
            </div>
            <div className="mt-1 text-xs text-white/38">risk score 128</div>
          </div>
        </div>
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 520"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M180 130 C300 170 340 220 400 260"
            stroke="rgba(255,255,255,.16)"
            strokeWidth="2"
          />
          <path
            d="M620 150 C520 190 470 230 400 260"
            stroke="rgba(255,255,255,.16)"
            strokeWidth="2"
          />
          <path
            d="M210 395 C300 340 340 300 400 260"
            stroke="rgba(255,255,255,.16)"
            strokeWidth="2"
          />
          <path
            d="M600 395 C520 345 470 300 400 260"
            stroke="rgba(255,255,255,.16)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </section>
  );
}

function Node({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle: string;
  className: string;
}) {
  return (
    <div
      className={`absolute z-10 rounded-2xl border border-white/[.09] bg-white/[.05] p-4 backdrop-blur ${className}`}
    >
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs text-white/40">{subtitle}</div>
    </div>
  );
}

function SignalEngine() {
  return (
    <section className="bg-[#f4f1eb] py-28 text-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,.9fr)_minmax(640px,1.1fr)] lg:items-center">
          <div>
            <div className="mb-5 text-xs uppercase tracking-[0.32em] text-[#b46021]">
              Deterministic before AI
            </div>
            <h2 className="max-w-[620px] text-5xl font-medium leading-[0.92] tracking-[-0.065em] md:text-7xl lg:text-[92px]">
              <span className="block">From webhook</span>
              <span className="block">to operational</span>
              <span className="block">decision.</span>
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-black/58">
              AI can summarize the situation, but rules decide what becomes
              evidence, when the threshold is crossed, and why the incident
              escalated.
            </p>
          </div>

          <div className="rounded-[2.2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
            <div className="grid gap-4 lg:grid-cols-4">
              <EngineStep
                icon={<IconGitHub />}
                title="Webhook"
                text="PR review requested"
              />
              <EngineStep
                icon={<IconActivity />}
                title="Signal"
                text="owner_missing"
              />
              <EngineStep
                icon={<IconShield />}
                title="Rule"
                text="+28 risk points"
              />
              <EngineStep
                icon={<IconUserMissing />}
                title="Action"
                text="assign owner"
              />
            </div>
            <div className="mt-8 rounded-[1.9rem] bg-[#111213] p-6 text-white">
              <div className="mb-5 text-xs uppercase tracking-[0.32em] text-white/35">
                Incident-ready evidence
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Evidence value="5" label="linked artifacts" />
                <Evidence value="6" label="rules triggered" />
                <Evidence value="18" label="audit entries" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EngineStep({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-[214px] rounded-[1.7rem] border border-black/10 bg-[#fcfaf7] p-5">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-black text-white">
        {icon}
      </div>
      <div className="text-[1.05rem] font-semibold tracking-[-0.02em]">
        {title}
      </div>
      <div className="mt-3 text-[15px] leading-8 text-black/50">{text}</div>
    </div>
  );
}

function Evidence({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-[162px] flex-col justify-between rounded-[1.7rem] border border-white/10 bg-white/[.05] p-5">
      <div className="text-[3.35rem] font-medium leading-none tracking-[-0.06em]">
        {value}
      </div>
      <div className="text-xs uppercase tracking-[0.26em] text-white/35">
        {label}
      </div>
    </div>
  );
}

function PilotSection() {
  return (
    <section id="pilot" className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
      <div className="overflow-hidden rounded-[2.3rem] border border-white/[.08] bg-white/[.035]">
        <div className="grid lg:grid-cols-[1.2fr_.8fr]">
          <div className="p-8 md:p-12">
            <div className="mb-5 text-xs uppercase tracking-[0.32em] text-[#d77b2f]">
              Paid pilot
            </div>
            <h2 className="max-w-2xl text-5xl font-medium leading-[0.98] tracking-[-0.06em] md:text-7xl">
              Launch with one real release workflow.
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">
              Novua Control is currently onboarded directly with each team. We
              configure the workflow, connect the sources, and tune the incident
              model together.
            </p>
            <a
              href="mailto:iveteamorim@gmail.com?subject=Novua%20Control%20pilot"
              className="mt-9 inline-flex rounded-full bg-white px-6 py-3 font-medium text-black"
            >
              Request pilot
            </a>
          </div>

          <div className="border-t border-white/[.08] bg-[#d77b2f] p-8 text-black md:p-12 lg:border-l lg:border-t-0">
            <div className="text-sm uppercase tracking-[0.28em] text-black/45">
              4-week pilot
            </div>
            <div className="mt-4 text-7xl font-medium tracking-[-0.08em]">
              EUR 2,500
            </div>
            <div className="mt-4 text-lg text-black/62">
              fixed pilot engagement
            </div>
            <div className="mt-8 space-y-3 text-sm font-medium">
              <div>✓ GitHub / Vercel / Linear setup</div>
              <div>✓ One release workflow</div>
              <div>✓ Incident console</div>
              <div>✓ Audit trail and action flow</div>
              <div>✓ 2–4 weeks onboarding support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconBase({
  children,
  size = 18,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconArrowRight({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

function IconGitHub({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M9 19c-5 1.5-5-2.5-7-3" />
      <path d="M15 22v-3.8a3.4 3.4 0 0 0-1-2.6c3.2-.4 6.5-1.6 6.5-7A5.4 5.4 0 0 0 19 4.8 5 5 0 0 0 18.9 1S17.7.6 15 2.5a13.4 13.4 0 0 0-7 0C5.3.6 4.1 1 4.1 1A5 5 0 0 0 4 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.5 7a3.4 3.4 0 0 0-1 2.6V22" />
    </IconBase>
  );
}

function IconRocket({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M4.5 16.5c-1.2 1-1.5 3-1.5 3s2-.3 3-1.5" />
      <path d="M9 15 6 12c.8-3.8 3.4-7.2 8-9 1.8-.7 4-.9 5-.2.7 1 .5 3.2-.2 5-1.8 4.6-5.2 7.2-9 8Z" />
      <path d="M15 9h.01" />
      <path d="M9 15l-2 2" />
    </IconBase>
  );
}

function IconList({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </IconBase>
  );
}

function IconBranch({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h3a3 3 0 0 1 3 3v6" />
      <path d="M6 8v10" />
    </IconBase>
  );
}

function IconShield({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </IconBase>
  );
}

function IconAlert({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconBase size={size} className={className}>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

function IconActivity({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M22 12h-4l-3 7-6-14-3 7H2" />
    </IconBase>
  );
}

function IconClock({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

function IconUserMissing({ size = 18 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21a7 7 0 0 1 11-5.7" />
      <path d="m17 17 4 4" />
      <path d="m21 17-4 4" />
    </IconBase>
  );
}
