"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useUser } from "@clerk/nextjs";

export default function HomePage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { isSignedIn } = useUser();


    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="min-h-screen bg-white text-black dark:bg-[#08080c] dark:text-white transition-colors duration-300">

            {/* Background Glow */}
            <div className="absolute inset-0 -z-10 dark:bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.15),transparent_30%)]" />

            {/* Navbar */}
            <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white via-purple-300 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-black">
                        ✨
                    </div>

                    <h1 className="text-2xl font-bold tracking-wide">
                        <span>Sparkle</span>
                        <span className="text-purple-500"> AI</span>
                    </h1>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">

                    {/* Theme Toggle */}
                    <button
                        onClick={() =>
                            setTheme(theme === "dark" ? "light" : "dark")
                        }
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    >
                        {mounted ? (theme === "dark" ? "🌞" : "🌙") : "🌙"}
                    </button>

                    <Link
                        href={isSignedIn ? "/dashboard" : "/login"}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
                    >
                        Login
                    </Link>

                    <Link
                        href={isSignedIn ? "/dashboard" : "/pricing"}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-purple-600/30"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid md:grid-cols-2 gap-16 items-center">

                {/* Left */}
                <div>

                    <div className="inline-block px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 text-sm text-purple-500 mb-6">
                        AI Marketing for Small Businesses
                    </div>

                    <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                        Turn Photos Into
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-700">
                            Sales Content ✨
                        </span>
                    </h2>

                    <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                        Upload your product image and let Sparkle AI generate
                        stunning descriptions, captions, and social media posts instantly.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href={isSignedIn ? "/dashboard" : "/signup"}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-7 py-3 rounded-xl font-medium transition shadow-lg shadow-purple-600/30"
                        >
                            Start Free
                        </Link>

                        <Link

                            href="/pricing"
                            className="border border-gray-300 dark:border-white/10 px-7 py-3 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition"
                        >
                            View Plans
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">

                        <div className="bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
                            <h3 className="text-2xl font-bold">10k+</h3>
                            <p className="text-sm text-gray-500">Captions Generated</p>
                        </div>

                        <div className="bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
                            <h3 className="text-2xl font-bold">500+</h3>
                            <p className="text-sm text-gray-500">Businesses Helped</p>
                        </div>

                        <div className="bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
                            <h3 className="text-2xl font-bold">24/7</h3>
                            <p className="text-sm text-gray-500">AI Availability</p>
                        </div>

                    </div>
                </div>

                {/* Right Card */}
                <div className="relative">

                    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

                        <div className="mb-5">
                            <p className="text-sm text-gray-500 mb-2">
                                Uploaded Product
                            </p>

                            <div className="h-40 rounded-2xl bg-gradient-to-br from-purple-500/20 to-white/5 border border-white/10 flex items-center justify-center text-6xl">
                                🕯️
                            </div>
                        </div>

                        <div className="space-y-4">

                            <div className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-xl">
                                <p className="text-sm text-gray-500 mb-1">
                                    Generated Description
                                </p>
                                <p className="text-sm">
                                    Elegant handmade candle crafted to bring warmth,
                                    luxury and calm to your home.
                                </p>
                            </div>

                            <div className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-xl">
                                <p className="text-sm text-gray-500 mb-1">
                                    Instagram Caption
                                </p>
                                <p className="text-sm">
                                    Light your moments ✨ #LuxuryDecor #Handmade
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-600/20 blur-3xl rounded-full" />
                </div>

            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-6 pb-24">

                <div className="grid md:grid-cols-3 gap-6">

                    {[
                        "AI Product Descriptions",
                        "Instant Social Captions",
                        "Boost Sales Faster",
                    ].map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:scale-[1.02] transition"
                        >
                            <div className="text-2xl mb-4">✨</div>
                            <h3 className="text-lg font-semibold">{item}</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Designed to help creators and businesses grow online.
                            </p>
                        </div>
                    ))}

                </div>
            </section>

        </main>
    );
}