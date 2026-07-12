export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <span className="font-display text-xl text-ink">Roomly</span>
        <nav className="flex gap-4 text-sm items-center">
          <ThemeToggle />
          {userId ? (
            <Link href="/dashboard" className="px-4 py-2 bg-ink text-parchment rounded-card">
              Go to app
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="px-4 py-2 text-ink/80 hover:text-ink">
                Sign in
              </Link>
              <Link href="/sign-up" className="px-4 py-2 bg-ink text-parchment rounded-card">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="font-display italic text-brass text-sm mb-4 tracking-wide">
          matched by fit, not just filters
        </p>
        <h1 className="font-display text-5xl md:text-6xl leading-tight text-ink mb-6">
          Find the room —<br /> and the flatmate — that actually fits
        </h1>
        <p className="text-ink/70 text-lg max-w-xl mx-auto mb-10">
          Roomly scores every listing against your budget and location before you even scroll,
          so you spend less time filtering and more time moving in.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/sign-up" className="px-6 py-3 bg-ink text-parchment rounded-card font-medium">
            Find a room
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-3 border border-ink/20 text-ink rounded-card font-medium hover:border-ink/40"
          >
            List a room
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-ink/10 bg-linen/50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="font-display italic text-brass text-sm mb-2 text-center">how it works</p>
          <h2 className="font-display text-3xl text-ink text-center mb-14">
            Three steps, no endless scrolling
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="01"
              title="Set your preferences"
              body="Tell us your budget, location, and move-in date once — or list a room if you're an owner."
            />
            <Step
              number="02"
              title="See your compatibility score"
              body="Every listing is scored against your preferences by AI, with a plain-language explanation of why it's a fit."
            />
            <Step
              number="03"
              title="Chat and move in"
              body="Express interest, get accepted, and chat in real time — no back-and-forth over email."
            />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-10">
          <Feature
            title="AI compatibility scoring"
            body="Not just a location filter — a 0–100 score with reasoning, so you know why a listing fits before you reach out."
          />
          <Feature
            title="Real-time chat"
            body="Once interest is accepted, talk instantly. No waiting on email replies."
          />
          <Feature
            title="Built for both sides"
            body="Owners see ranked, high-intent tenants. Tenants see ranked, relevant rooms. Nobody wades through noise."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl text-ink mb-6">Ready to find your fit?</h2>
          <Link href="/sign-up" className="px-6 py-3 bg-ink text-parchment rounded-card font-medium inline-block">
            Get started — it's free
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/10 py-8">
        <p className="text-center text-xs text-ink/40">Roomly — a demo project</p>
      </footer>
    </main>
  );
}

function Step({ number, title, body }) {
  return (
    <div>
      <div className="font-display text-3xl text-brass mb-3">{number}</div>
      <h3 className="font-display text-lg text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink/60 leading-relaxed">{body}</p>
    </div>
  );
}

function Feature({ title, body }) {
  return (
    <div className="p-6 bg-linen border border-ink/10 rounded-card">
      <h3 className="font-display text-lg text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink/60 leading-relaxed">{body}</p>
    </div>
  );
}
