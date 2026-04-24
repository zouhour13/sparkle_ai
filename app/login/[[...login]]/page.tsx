"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-purple-50/40 to-white dark:from-[#07070b] dark:via-[#07070b] dark:to-[#07070b]" />

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-52 -right-52 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-52 -left-52 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="absolute top-6 right-6 w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition text-base bg-white/80 dark:bg-white/5 backdrop-blur-xl"
        aria-label="Toggle theme"
      >
        {isDark ? "🌞" : "🌙"}
      </button>

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        ← Back to home
      </Link>

      {/* Card */}
      <div className="w-full max-w-md animate-slideUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-11 h-11 rounded-2xl gradient-purple flex items-center justify-center text-2xl shadow-lg shadow-purple-600/30">
              ✨
            </div>
            <span className="text-2xl font-bold">
              Sparkle <span className="gradient-text">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Clerk SignIn — fully styled via globals.css overrides */}
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          fallbackRedirectUrl="/dashboard"
        />

        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}