export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import ThemeToggle from "@/components/ThemeToggle";
import DashboardPreview from "@/components/landing/DashboardPreview";

const STATS = [
  { value: "10K+", label: "Rooms listed" },
  { value: "25K+", label: "Matches made" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.8/5", label: "User rating" },
];

const FEATURES = [
  {
    title: "AI compatibility scoring",
    body: "Every listing gets a 0–100 score with a plain-language explanation of why it fits your budget and location.",
    icon: "◎",
  },
  {
    title: "Smart location matching",
    body: "Go beyond filters — Roomly understands neighbourhood overlap and proximity to where you want to live.",
    icon: "⌖",
  },
  {
    title: "Budget planning",
    body: "Set your rent range once. Listings outside your budget are scored lower so you see realistic options first.",
    icon: "₹",
  },
  {
    title: "Built for owners too",
    body: "List a room, review interested tenants ranked by compatibility, and accept the best fits.",
    icon: "⌂",
  },
  {
    title: "Real-time chat",
    body: "Once interest is accepted, chat instantly — no waiting on email replies or missed messages.",
    icon: "✉",
  },
  {
    title: "Automated match alerts",
    body: "Save your preferences and get emailed your top matches the moment they're scored.",
    icon: "⚡",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Create your account",
    body: "Sign up in minutes — tell us if you're looking for a room or listing one.",
  },
  {
    step: "2",
    title: "Set your preferences",
    body: "Add budget, location, and move-in date. Owners post room details in one form.",
  },
  {
    step: "3",
    title: "Get matched & chat",
    body: "Browse AI-ranked listings, express interest, and chat live when accepted.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Software engineer",
    quote:
      "Roomly saved me weeks of scrolling. The compatibility scores actually explained why a room was a good fit — I found my place in Koramangala in under a week.",
  },
  {
    name: "Arjun Mehta",
    role: "Flat owner",
    quote:
      "I listed my spare room and got three serious tenants within days. Seeing their match scores helped me pick someone who'd actually stay long-term.",
  },
  {
    name: "Sneha Reddy",
    role: "Design freelancer",
    quote:
      "The chat feature after acceptance was a game-changer. No more awkward email chains — we sorted viewing and move-in over a single afternoon.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-parchment/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-xl text-ink shrink-0">
            Roomly
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink/70">
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              How it works
            </a>
            <a href="#testimonials" className="hover:text-ink transition-colors">
              Testimonials
            </a>
            <Link href="/listings" className="hover:text-ink transition-colors">
              Browse rooms
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <ThemeToggle />
            {userId ? (
              <Link href="/dashboard" className="px-4 py-2 bg-ink text-parchment rounded-card">
                Go to app
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hidden sm:inline text-ink/70 hover:text-ink">
                  Sign in
                </Link>
                <Link href="/sign-up" className="px-4 py-2 bg-ink text-parchment rounded-card">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(var(--color-moss)/0.08),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 md:pt-20 md:pb-14 text-center relative">
          <p className="inline-block text-xs font-medium uppercase tracking-widest text-moss mb-4 px-3 py-1 rounded-full bg-moss/10 border border-moss/20">
            AI-powered room matching
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight text-ink max-w-3xl mx-auto mb-5">
            Find the room — and the flatmate — that actually fits
          </h1>
          <p className="text-ink/65 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            An AI-powered platform that scores every listing against your budget, location, and move-in date — so you
            spend less time filtering and more time moving in.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-ink text-parchment rounded-card font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Find a room
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-3 border border-ink/20 text-ink rounded-card font-medium text-sm hover:border-ink/40 transition-colors"
            >
              List a room
            </Link>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-ink/10 bg-linen/40">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl text-ink">{s.value}</div>
              <div className="text-sm text-ink/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl text-ink mb-3">
            Everything you need to find your fit
          </h2>
          <p className="text-ink/60 max-w-lg mx-auto">
            From AI scoring to real-time chat — built for tenants and owners alike.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-card border border-ink/10 bg-linen/50 hover:border-moss/30 hover:bg-linen transition-colors"
            >
              <span className="text-2xl text-brass mb-3 block" aria-hidden="true">
                {f.icon}
              </span>
              <h3 className="font-display text-lg text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-ink/10 bg-linen/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl md:text-4xl text-ink text-center mb-14">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <div className="w-10 h-10 rounded-full bg-ink text-parchment font-display text-lg flex items-center justify-center mx-auto md:mx-0 mb-4">
                  {s.step}
                </div>
                <h3 className="font-display text-xl text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl text-ink text-center mb-14">What our users say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="p-6 rounded-card border border-ink/10 bg-parchment flex flex-col"
            >
              <p className="text-sm text-ink/70 leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
              <footer>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-moss/15 text-moss flex items-center justify-center font-display text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <cite className="not-italic font-medium text-sm text-ink">{t.name}</cite>
                    <p className="text-xs text-ink/50">{t.role}</p>
                  </div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ink/10 bg-gradient-to-b from-linen/50 to-moss/10">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-ink mb-4">
            Ready to find your fit?
          </h2>
          <p className="text-ink/60 mb-8">
            Join thousands of tenants and owners already matching smarter on Roomly.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-3 bg-ink text-parchment rounded-card font-medium hover:opacity-90 transition-opacity"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink/40">
          <span className="font-display text-ink/60">Roomly</span>
          <p>Made to handle room hunting — matched by fit, not just filters.</p>
        </div>
      </footer>
    </main>
  );
}
