"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const PLANS = [
  {
    id: "free",
    name: "Free",
    badge: null,
    monthlyPrice: "0",
    annualPrice: "0",
    desc: "Perfect for trying out Sparkle AI",
    color: "border-gray-200 dark:border-white/10",
    btnClass: "btn-secondary w-full mt-8",
    btnLabel: "Start Free",
    href: "signup",
    features: [
      "3 months full access",
      "25 generations / month",
      "Product title + description",
      "Instagram & Facebook captions",
      "Hashtag suggestions",
      "English language only",
      "Standard processing speed",
      "Email support",
    ],
    notIncluded: ["Priority generation", "All languages", "History export", "API access"],
  },
  {
    id: "pro",
    name: "Pro Monthly",
    badge: "Most Popular",
    monthlyPrice: "9",
    annualPrice: "7",
    desc: "For businesses that create content regularly",
    color: "border-purple-500",
    btnClass: "btn-primary w-full mt-8",
    btnLabel: "Start Pro",
    href: "signup",
    features: [
      "Unlimited generations",
      "All 5 content types",
      "Instagram, Facebook, TikTok, LinkedIn",
      "10+ tone options",
      "English, French, Arabic + more",
      "Priority AI processing",
      "Generation history (90 days)",
      "CSV / PDF export",
      "Priority email support",
      "Early access to new features",
    ],
    notIncluded: ["API access", "Custom brand voice"],
  },
  {
    id: "annual",
    name: "Pro Annual",
    badge: "Save 30%",
    monthlyPrice: "79",
    annualPrice: "79",
    desc: "Best value for committed creators",
    color: "border-gray-200 dark:border-white/10",
    btnClass: "btn-primary w-full mt-8",
    btnLabel: "Start Annual",
    href: "signup",
    features: [
      "Everything in Pro Monthly",
      "Full year — lowest per-month cost",
      "API access (coming soon)",
      "Custom brand voice training",
      "Team member seat (1 extra)",
      "Dedicated account review",
      "12-month generation history",
      "Priority feature requests",
      "1 free onboarding call",
      "Custom invoicing",
    ],
    notIncluded: [],
  },
];

const FAQS = [
  {
    q: "Do I need a credit card for the free plan?",
    a: "No. The Free plan requires no payment information. Just sign up and start generating content immediately.",
  },
  {
    q: "What happens after the 3-month free trial?",
    a: "After 3 months, your free plan expires. You can upgrade to Pro Monthly or Annual at any time to keep generating content.",
  },
  {
    q: "What AI models power Sparkle AI?",
    a: "We use BLIP for image understanding and open-source language models for text generation — completely free-tier optimized.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly plans can be cancelled anytime. Annual plans are billed yearly but include a 14-day money-back guarantee.",
  },
  {
    q: "What languages are supported?",
    a: "The Free plan supports English. Pro plans support French, Arabic, Spanish, German, and more languages added regularly.",
  },
];

export default function PricingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { isSignedIn } = useUser();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#07070b]" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-purple flex items-center justify-center text-base shadow-md shadow-purple-600/30">✨</div>
            <span className="font-bold text-lg">Sparkle <span className="gradient-text">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition text-sm"
              >
                {isDark ? "🌞" : "🌙"}
              </button>
            )}
            <Link href={isSignedIn ? "/dashboard" : "/login"} className="btn-secondary text-sm py-2 px-4">
              {isSignedIn ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="text-center mb-16 animate-slideUp">
          <div className="badge mx-auto mb-5">Pricing</div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h1>
          <p className="mt-5 text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Start free for 3 months. Upgrade when you&apos;re ready. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 mt-8 glass px-2 py-2 rounded-2xl">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${!annual ? "gradient-purple text-white shadow-lg shadow-purple-600/30" : "text-gray-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${annual ? "gradient-purple text-white shadow-lg shadow-purple-600/30" : "text-gray-500"}`}
            >
              Annual
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-lg">-30%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => {
            const price = annual && plan.id !== "free" ? plan.annualPrice : plan.monthlyPrice;
            const isFeatured = plan.id === "pro";
            const href = isSignedIn ? "/dashboard" : `/${plan.href}`;

            return (
              <div
                key={plan.id}
                className={`relative card p-8 flex flex-col transition-all duration-300 ${plan.color} ${
                  isFeatured
                    ? "scale-[1.03] shadow-2xl shadow-purple-500/20 border-purple-500"
                    : "hover:scale-[1.01]"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full text-white shadow-lg ${
                    plan.badge === "Save 30%" ? "bg-green-500" : "gradient-purple"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{plan.desc}</p>

                <div className="mt-6 mb-2">
                  <span className="text-5xl font-extrabold gradient-text">
                    ${plan.id === "annual" && annual ? Math.round(79 / 12) : price}
                  </span>
                  {plan.id !== "free" && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      {plan.id === "annual" ? "/mo billed annually" : "/month"}
                    </span>
                  )}
                  {plan.id === "free" && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">3 months free</span>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400 dark:text-gray-600">
                      <span className="mt-0.5 shrink-0">✕</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={href} className={plan.btnClass}>
                  {plan.btnLabel}
                </Link>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="card overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-medium text-sm md:text-base"
                >
                  {faq.q}
                  <span className={`text-purple-400 transition-transform duration-200 shrink-0 ${openFaq === i ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-white/5 pt-4 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Still have questions? We&apos;re happy to help.
          </p>
          <Link href={isSignedIn ? "/dashboard" : "/signup"} className="btn-primary">
            ✨ Get Started Free
          </Link>
        </div>
      </div>
    </main>
  );
}