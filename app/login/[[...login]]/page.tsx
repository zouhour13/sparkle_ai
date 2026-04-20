"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative min-h-screen flex items-center justify-center px-4 text-black dark:text-white overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-purple-50 dark:from-[#07070b] dark:via-[#07070b] dark:to-[#07070b]" />

            {/* GLOW */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-[-220px] right-[-220px] w-[650px] h-[650px] bg-purple-500/25 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-220px] left-[-220px] w-[650px] h-[650px] bg-fuchsia-500/10 blur-[150px] rounded-full" />
            </div>

            {/* THEME TOGGLE */}
            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="absolute top-6 right-6 px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5"
            >
                {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
            </button>

            {/* LOGIN CARD */}
            <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-2xl shadow-2xl p-8">

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold">
                        Sparkle <span className="text-purple-500">AI ✨</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Welcome back, please login
                    </p>
                </div>

                {/* ✅ FIX: REMOVE routing="path" */}
                <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                fallbackRedirectUrl="/dashboard"
                />
                                {/* FOOTER */}
                <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                    Don’t have an account?{" "}
                    <Link href="/signup" className="text-purple-500 hover:underline">
                        Sign up
                    </Link>
                </p>

            </div>
        </main>
    );
}