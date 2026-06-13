import Link from "next/link";
import {
  CursorClick,
  ArrowsInLineHorizontal,
  ChartBar,
  ClockCounterClockwise,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

const FEATURES = [
  {
    title: "One-click capture",
    body: "A Chrome extension scrapes your conversation from Claude or ChatGPT with message roles preserved — no manual copy-pasting.",
    Icon: CursorClick,
  },
  {
    title: "AI compression",
    body: "Gemini distills long chat logs into a structured snippet — goal, current state, finalized decisions, open questions, tech stack — capped at 300 words.",
    Icon: ArrowsInLineHorizontal,
  },
  {
    title: "Measurable results",
    body: "See before/after token counts and the exact reduction ratio for every compression, so you know how much context you saved.",
    Icon: ChartBar,
  },
  {
    title: "Local history",
    body: "Every compression is saved in your browser — revisit, copy, or delete past context blocks. No account, no database, fully private.",
    Icon: ClockCounterClockwise,
  },
];

const STEPS = [
  { n: "01", title: "Capture", body: "Open a chat on Claude or ChatGPT and click the extension — or paste any conversation into the playground." },
  { n: "02", title: "Compress", body: "Gemini condenses the conversation into a dense, structured context block in seconds." },
  { n: "03", title: "Reuse", body: "Copy the snippet into a new AI session to carry your context forward — no re-explaining." },
];

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-line bg-subtle">
        <div className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-muted text-xs font-medium tracking-wide uppercase">
            Chrome extension + web app
          </span>
          <h1 className="mt-8 font-display font-semibold text-5xl sm:text-6xl text-ink leading-[1.05] tracking-tight">
            Carry context between
            <br />
            every <span className="text-accent">AI conversation</span>
          </h1>
          <p className="mt-6 text-lg text-body max-w-xl mx-auto leading-relaxed">
            ContextBridge captures your Claude and ChatGPT chats and compresses them into
            dense, reusable context blocks — so you never re-explain yourself when switching
            tools or starting fresh.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
            >
              Try the playground
              <ArrowRight size={18} weight="bold" />
            </Link>
            <a
              href="https://github.com/yuvrajgohil24/Context-Bridge"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-line-strong hover:bg-subtle text-ink font-medium transition-colors"
            >
              View source
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-12">
          How it works
        </p>
        <div className="grid md:grid-cols-3 gap-px bg-line rounded-2xl overflow-hidden border border-line">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-surface p-8">
              <span className="font-mono text-sm font-medium text-accent">{step.n}</span>
              <h3 className="font-display text-ink font-semibold text-lg mt-3 mb-2">{step.title}</h3>
              <p className="text-sm text-body leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-subtle border-y border-line">
        <div className="max-w-5xl mx-auto px-6 py-20 w-full">
          <h2 className="text-center font-display font-semibold text-4xl text-ink mb-3">
            Built for AI power users
          </h2>
          <p className="text-center text-body mb-12 max-w-xl mx-auto">
            Everything you need to stop losing context across tools and sessions.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map(({ title, body, Icon }) => (
              <div
                key={title}
                className="bg-surface border border-line rounded-xl p-6 hover:border-line-strong hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-accent-soft flex items-center justify-center mb-4">
                  <Icon size={22} weight="duotone" className="text-accent" />
                </div>
                <h3 className="font-display text-ink font-semibold mb-2">{title}</h3>
                <p className="text-sm text-body leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 w-full text-center">
        <h2 className="font-display font-semibold text-4xl text-ink mb-3">
          Stop re-explaining yourself.
        </h2>
        <p className="text-body mb-8">
          Paste a conversation and watch it shrink into a portable context block.
        </p>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
        >
          Open the playground
          <ArrowRight size={18} weight="bold" />
        </Link>
      </section>
    </main>
  );
}
