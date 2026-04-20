"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignUpButton, useUser } from "@clerk/nextjs";

export default function PricingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isSignedIn } = useUser(); // ✅ detect login

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const plans = [
    {
      name: "Free",
      price: "0$",
      desc: "3 Months trial access",
      button: "Start Free",
      featured: false,
    },
    {
      name: "Pro Monthly",
      price: "$9/mo",
      desc: "Unlimited generations + priority support",
      button: "Choose Plan",
      featured: true,
    },
    {
      name: "Pro Annual",
      price: "$79/year",
      desc: "Save more with yearly billing",
      button: "Choose Plan",
      featured: false,
    },
  ];

  return (
    <main className="relative min-h-screen px-6 py-16 text-black dark:text-white transition-colors duration-300">

      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#08080c]" />

      {/* Toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5"
      >
        {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
      </button>

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold">
            Choose Your <span className="text-purple-500">Plan</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg">
            Flexible pricing for every business size.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border shadow-lg backdrop-blur-xl
              bg-white dark:bg-white/5
              border-gray-200 dark:border-white/10
              ${plan.featured ? "scale-105 border-purple-500" : ""}
            `}
            >
              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <p className="text-4xl font-bold mt-4 text-purple-600">
                {plan.price}
              </p>

              <p className="text-gray-500 dark:text-gray-400 mt-4">
                {plan.desc}
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>✔ AI Product Descriptions</li>
                <li>✔ Social Media Captions</li>
                <li>✔ Fast Generation</li>
              </ul>

              {/* FREE PLAN BUTTON */}
              {plan.name === "Free" ? (
                isSignedIn ? (
                  <Link href="/dashboard">
                    <button className="w-full mt-8 py-3 rounded-xl font-medium border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10">
                      Start Free
                    </button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <button className="w-full mt-8 py-3 rounded-xl font-medium border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10">
                      Start Free
                    </button>
                  </Link>
                )
              ) : (
                <SignUpButton mode="redirect">
                  <button className="w-full mt-8 py-3 rounded-xl font-medium bg-purple-600 text-white hover:bg-purple-700">
                    {plan.button}
                  </button>
                </SignUpButton>
              )}
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}