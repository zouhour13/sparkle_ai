"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 text-black dark:text-white overflow-hidden transition-colors duration-500">

      {/* BASE BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-purple-50 to-white dark:from-[#07070b] dark:via-[#07070b] dark:to-[#07070b] transition-colors duration-500" />

      {/* GLOW */}
      <div className="absolute inset-0 -z-10">

        <div className="absolute top-[-240px] right-[-240px] w-[650px] h-[650px] bg-purple-500/20 dark:bg-purple-600/30 blur-[150px] rounded-full" />

        <div className="absolute bottom-[-240px] left-[-240px] w-[650px] h-[650px] bg-fuchsia-500/10 dark:bg-purple-500/15 blur-[160px] rounded-full" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.10),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_70%)]" />
      </div>

      {/* THEME TOGGLE */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl shadow-sm transition"
      >
        {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
      </button>

      {/* CARD */}
      <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-2xl shadow-2xl p-8 transition-all duration-500">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Sparkle <span className="text-purple-500">AI ✨</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Create your account and start growing
          </p>
        </div>

        {/* CLERK SIGNUP */}
        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
          />
        </div>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-purple-500 font-medium hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </main>
  );
}