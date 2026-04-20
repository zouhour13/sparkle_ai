"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";

export default function DashboardPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative min-h-screen flex text-black dark:text-white overflow-hidden transition-colors duration-500">

            {/* BACKGROUND */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-50 via-white to-purple-50 dark:from-[#07070b] dark:via-[#07070b] dark:to-[#07070b]" />

            {/* LIGHT EFFECTS */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-[-300px] right-[-300px] w-[800px] h-[800px] bg-purple-500/20 dark:bg-purple-600/30 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-300px] left-[-300px] w-[800px] h-[800px] bg-fuchsia-500/10 dark:bg-purple-500/15 blur-[180px] rounded-full" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.10),transparent_75%)] dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_75%)]" />
            </div>

            {/* SIDEBAR */}
            <aside className="hidden md:flex w-72 flex-col p-6 border-r border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-2xl">

                <h1 className="text-2xl font-bold text-purple-500 mb-10 tracking-wide">
                    Sparkle AI ✨
                </h1>

                <nav className="space-y-3">

                    <Link
                        href="/dashboard"
                        className="block px-4 py-3 rounded-xl bg-purple-100 text-purple-700 dark:bg-white/10 dark:text-white font-medium"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/pricing"
                        className="block px-4 py-3 rounded-xl hover:bg-purple-50 dark:hover:bg-white/10 transition"
                    >
                        Upgrade Plan
                    </Link>

                    <button className="block w-full text-left px-4 py-3 rounded-xl hover:bg-purple-50 dark:hover:bg-white/10 transition">
                        History
                    </button>

                    <button className="block w-full text-left px-4 py-3 rounded-xl hover:bg-purple-50 dark:hover:bg-white/10 transition">
                        Settings
                    </button>

                    <SignOutButton redirectUrl="/login">
                        <button className="block w-full text-left px-4 py-3 rounded-xl hover:bg-purple-50 dark:hover:bg-white/10 transition">
                            Logout
                        </button>
                    </SignOutButton>

                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <section className="flex-1 p-6 md:p-10 relative">

                {/* THEME BUTTON */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="absolute top-6 right-6 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-sm hover:scale-[1.02] transition"
                >
                    {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
                </button>

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">

                    <div>
                        <h2 className="text-4xl font-bold tracking-tight">
                            Welcome Back 👋
                        </h2>

                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Upload your product image and generate content instantly.
                        </p>
                    </div>

                    <Link
                        href="/pricing"
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-600/25 md:mt-8"
                    >
                        Upgrade Plan
                    </Link>
                </div>

                {/* STATS */}
                <div className="grid md:grid-cols-4 gap-6 mb-10">

                    {[
                        ["Current Plan", "Free"],
                        ["Remaining Time", "78 Days"],
                        ["Posts Generated", "24"],
                        ["Credits Left", "12"],
                    ].map(([title, value]) => (
                        <div
                            key={title}
                            className="rounded-2xl p-6 border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-2xl shadow-sm hover:shadow-md transition"
                        >
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {title}
                            </p>

                            <h3 className="text-3xl font-bold mt-2 text-purple-600">
                                {value}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* GENERATOR */}
                <div className="rounded-2xl p-8 border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-2xl shadow-sm">

                    <h3 className="text-2xl font-bold mb-6">
                        Sparkle Generator ✨
                    </h3>

                    <div className="space-y-5">

                        {/* IMAGE UPLOAD */}
                        <div className="rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-500/40 bg-white/60 dark:bg-black/20 p-8 text-center hover:border-purple-500 transition">

                            <input
                                type="file"
                                accept="image/*"
                                id="imageUpload"
                                className="hidden"
                            />

                            <label
                                htmlFor="imageUpload"
                                className="cursor-pointer flex flex-col items-center justify-center gap-3"
                            >
                                <div className="text-5xl">📷</div>

                                <p className="text-lg font-semibold">
                                    Upload Product Image
                                </p>

                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    JPG, PNG or WEBP
                                </p>

                                <span className="mt-2 inline-block bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition">
                                    Choose Image
                                </span>
                            </label>
                        </div>

                        {/* OPTIONS */}
                        <div className="grid md:grid-cols-3 gap-4">

                            <select className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/30">
                                <option>Instagram</option>
                                <option>Facebook</option>
                                <option>TikTok</option>
                                <option>LinkedIn</option>
                            </select>

                            <select className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/30">
                                <option>Professional</option>
                                <option>Luxury</option>
                                <option>Friendly</option>
                                <option>Trendy</option>
                            </select>

                            <select className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/30">
                                <option>English</option>
                                <option>French</option>
                                <option>Arabic</option>
                            </select>

                        </div>

                        {/* BUTTONS */}
                        <div className="flex flex-wrap gap-3">

                            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-600/25">
                                Generate Description
                            </button>

                            <button className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 transition">
                                Copy Text
                            </button>

                            <button className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 transition">
                                Save Draft
                            </button>

                        </div>

                        {/* RESULT */}
                        <div className="rounded-xl p-5 border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/30">

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                Generated Result:
                            </p>

                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                                Your premium handmade candle brings elegance and warmth to every room.
                                Perfect for gifts and home decoration.
                            </p>
                        </div>

                        {/* HISTORY */}
                        <div className="rounded-xl p-5 border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/30">

                            <p className="font-semibold mb-3">
                                Recent History
                            </p>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p>• Luxury perfume caption</p>
                                <p>• Handmade candle description</p>
                                <p>• Jewelry Instagram post</p>
                            </div>

                        </div>

                    </div>
                </div>

            </section>
        </main>
    );
}