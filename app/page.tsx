"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

/* ─── tiny helpers ─── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

const FEATURES = [
  {
    icon: "🖼️",
    title: "Image Intelligence",
    desc: "BLIP + LLaVA vision models analyze your product photo and extract every visual detail automatically.",
  },
  {
    icon: "✍️",
    title: "Premium Descriptions",
    desc: "Get persuasive, marketing-focused product descriptions that convert browsers into buyers.",
  },
  {
    icon: "📱",
    title: "Social Media Captions",
    desc: "Platform-optimized captions for Instagram, Facebook, TikTok, and LinkedIn — tuned per audience.",
  },
  {
    icon: "🎯",
    title: "Call-To-Action",
    desc: "Compelling CTAs crafted to drive clicks, DMs, and purchases for your specific product.",
  },
  {
    icon: "#️⃣",
    title: "Smart Hashtags",
    desc: "Relevant, trending hashtags generated from your product category for maximum reach.",
  },
  {
    icon: "🌍",
    title: "Multi-language",
    desc: "Generate content in English, French, Arabic and more — reach your audience in their language.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload Your Photo",
    desc: "Drag and drop any product image — candles, jewelry, clothing, food, perfumes, and more.",
    icon: "📤",
  },
  {
    step: "02",
    title: "Choose Your Style",
    desc: "Pick the social platform, tone of voice, and output language that fits your brand.",
    icon: "🎨",
  },
  {
    step: "03",
    title: "Get Instant Content",
    desc: "AI generates a title, description, caption, CTA, and hashtags in seconds — ready to copy.",
    icon: "⚡",
  },
];

const TESTIMONIALS = [
  {
    name: "Layla M.",
    role: "Handmade Candle Shop Owner",
    avatar: "🕯️",
    text: "I used to spend 2 hours writing product descriptions. Now Sparkle AI does it in 10 seconds. My sales increased 40% this month.",
    stars: 5,
  },
  {
    name: "Karim B.",
    role: "Fashion Boutique Owner",
    avatar: "👗",
    text: "The Instagram captions are absolutely stunning. My engagement rate doubled after switching to Sparkle AI content.",
    stars: 5,
  },
  {
    name: "Sara T.",
    role: "Artisan Jewelry Creator",
    avatar: "💍",
    text: "As a non-native English speaker, this tool is a game changer. I get professional copy without hiring a copywriter.",
    stars: 5,
  },
];

const STATS = [
  { value: "10k+", label: "Captions Generated" },
  { value: "500+", label: "Businesses Powered" },
  { value: "4.9★", label: "Average Rating" },
  { value: "24/7", label: "AI Availability" },
];

/* ─── animated demo card ─── */
const DEMO_LINES = [
  { label: "Title", content: "Moonlit Luxury Candle — Hand-Poured Artisan Wax" },
  { label: "Caption", content: "Light the room. Light your soul. ✨ #LuxuryDecor" },
  { label: "CTA", content: "Shop now and elevate your home ambiance today →" },
];

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setDemoIndex((prev) => (prev + 1) % DEMO_LINES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <main className="min-h-screen bg-white dark:bg-[#07070b] text-black dark:text-white overflow-x-hidden">

      {/* ── AMBIENT GLOWS ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute animate-blob"
          style={{
            width: 700, height: 700,
            top: -200, right: -200,
            background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute animate-blob"
          style={{
            width: 600, height: 600,
            bottom: -200, left: -150,
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
            animationDelay: "4s",
          }}
        />
      </div>

      {/* ══════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center text-lg shadow-lg shadow-purple-600/30">
              ✨
            </div>
            <span className="text-xl font-bold tracking-tight">
              Sparkle <span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition text-base"
                aria-label="Toggle theme"
              >
                {isDark ? "🌞" : "🌙"}
              </button>
            )}

            <Link
              href={isSignedIn ? "/dashboard" : "/login"}
              className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
            >
              Sign in
            </Link>

            <Link
              href={isSignedIn ? "/dashboard" : "/signup"}
              className="btn-primary text-sm py-2 px-5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <div className="animate-slideUp">
          <div className="badge mb-6">
            <span className="animate-sparkle">✨</span>
            AI Marketing for Small Businesses
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
            Turn Photos Into{" "}
            <span className="gradient-text block mt-1">
              Sales Content
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
            Upload your product image and Sparkle AI instantly generates a
            title, description, social caption, CTA, and hashtags — powered by
            free open-source AI models.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={isSignedIn ? "/dashboard" : "/signup"}
              className="btn-primary"
            >
              ✨ Start Free — No Credit Card
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See How It Works →
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — animated demo card */}
        <div className="relative animate-float">
          <div
            className="glass rounded-3xl p-8 shadow-2xl"
            style={{ boxShadow: "0 0 80px rgba(168,85,247,0.15)" }}
          >
            {/* Product preview */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-widest">
                Uploaded Product
              </p>
              <div className="h-44 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent border border-white/10 flex items-center justify-center text-7xl">
                🕯️
              </div>
            </div>

            {/* Animated result */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                AI Generated
              </p>
              {DEMO_LINES.map((line, i) => (
                <div
                  key={i}
                  className={`result-card p-4 transition-all duration-500 ${
                    i === demoIndex
                      ? "border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                      : "opacity-50"
                  }`}
                >
                  <p className="text-xs text-purple-400 font-semibold mb-1">
                    {line.label}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                    {line.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Generating indicator */}
            <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              AI generating content in real-time...
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 glass rounded-2xl px-4 py-2 text-sm font-semibold shadow-lg border border-purple-500/20">
            🚀 2 sec generation
          </div>
          <div className="absolute -bottom-4 -left-4 glass rounded-2xl px-4 py-2 text-sm font-semibold shadow-lg border border-purple-500/20">
            🆓 Free to start
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mx-auto mb-4">How It Works</div>
            <h2 className="text-4xl font-bold">Three Steps to Great Content</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              From product photo to ready-to-post marketing content in under 5 seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="card p-8 text-center hover:scale-[1.02] transition-transform"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center text-2xl mx-auto mb-5 shadow-lg shadow-purple-600/30">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-purple-400 tracking-widest mb-2">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mx-auto mb-4">Features</div>
            <h2 className="text-4xl font-bold">
              Everything Your Business Needs
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              One upload, five powerful outputs. All powered by state-of-the-art open-source AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="card p-7 hover:scale-[1.02] hover:border-purple-500/30 transition-all cursor-default"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge mx-auto mb-4">Testimonials</div>
            <h2 className="text-4xl font-bold">Loved by Creators & Sellers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-7 flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-16 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(124,58,237,0.1) 100%)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            <div className="absolute inset-0 -z-10" style={{
              background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 70%)",
            }} />

            <div className="text-5xl mb-6 animate-sparkle">✨</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Start Creating{" "}
              <span className="gradient-text">for Free</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-lg mx-auto">
              Join 500+ businesses using Sparkle AI to write better content, faster.
              Free plan includes 3 months of access.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={isSignedIn ? "/dashboard" : "/signup"}
                className="btn-primary text-base py-4 px-10"
              >
                ✨ Get Started Free
              </Link>
              <Link href="/pricing" className="btn-secondary text-base py-4 px-8">
                View Pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl gradient-purple flex items-center justify-center text-base shadow-md shadow-purple-600/30">
              ✨
            </div>
            <span className="font-bold text-lg">
              Sparkle <span className="gradient-text">AI</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="hover:text-purple-500 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="hover:text-purple-500 transition-colors">
              Login
            </Link>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Sparkle AI. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}