"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";

/* ─── Types ─── */
interface GeneratedContent {
  title: string;
  description: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

interface HistoryItem {
  id: string;
  imagePreview: string;
  platform: string;
  tone: string;
  result: GeneratedContent;
  createdAt: string;
}

/* ─── Constants ─── */
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "Pinterest"];
const TONES = ["Professional", "Luxury", "Friendly", "Trendy", "Playful", "Minimalist"];
const LANGUAGES = ["English", "French", "Arabic", "Spanish", "German"];

const RESULT_LABELS: { key: keyof GeneratedContent; icon: string; label: string; color: string }[] = [
  { key: "title",       icon: "🏷️", label: "Product Title",       color: "from-purple-500/10 to-transparent" },
  { key: "description", icon: "📝", label: "Description",         color: "from-blue-500/10 to-transparent" },
  { key: "caption",     icon: "📱", label: "Social Caption",      color: "from-pink-500/10 to-transparent" },
  { key: "cta",         icon: "🎯", label: "Call to Action",      color: "from-orange-500/10 to-transparent" },
  { key: "hashtags",    icon: "#️⃣", label: "Hashtags",            color: "from-green-500/10 to-transparent" },
];

/* ─── Skeleton loader ─── */
function SkeletonCard() {
  return (
    <div className="result-card p-6 space-y-3">
      <div className="skeleton h-4 w-24 rounded-lg" />
      <div className="skeleton h-4 w-full rounded-lg" />
      <div className="skeleton h-4 w-3/4 rounded-lg" />
    </div>
  );
}

/* ─── Copy button ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
        ${copied
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
        }`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  /* Generator state */
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* History */
  const [history, setHistory] = useState<HistoryItem[]>([]);

  /* Sidebar */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sparkle_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  /* ── Image upload ── */
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    const url = URL.createObjectURL(f);
    setImage(url);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  /* ── Generate ── */
  const handleGenerate = async () => {
    if (!file) { setError("Please upload a product image first."); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("platform", platform.toLowerCase());
      form.append("tone", tone.toLowerCase());
      form.append("language", language.toLowerCase());

      const res = await fetch("/api/generate", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data: GeneratedContent = await res.json();
      setResult(data);

      /* Save to history */
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        imagePreview: image!,
        platform,
        tone,
        result: data,
        createdAt: new Date().toLocaleString(),
      };
      const updated = [newItem, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("sparkle_history", JSON.stringify(updated));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  const isDark = theme === "dark";
  const firstName = user?.firstName || "there";

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div className="relative min-h-screen flex text-black dark:text-white">

      {/* ── AMBIENT BG ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-gray-50 to-white dark:from-[#07070b] dark:to-[#07070b]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-80 -right-80 w-[900px] h-[900px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 65%)", filter: "blur(120px)" }} />
        <div className="absolute -bottom-80 -left-80 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)", filter: "blur(120px)" }} />
      </div>

      {/* ══ SIDEBAR ══ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-68 flex flex-col p-6 border-r
        glass transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-2xl
      `} style={{ width: 260 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center text-lg shadow-md shadow-purple-600/30">✨</div>
          <span className="text-xl font-bold">Sparkle <span className="gradient-text">AI</span></span>
        </Link>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-lg">
              {user.firstName?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {[
            { icon: "⚡", label: "Dashboard",    href: "/dashboard", active: true  },
            { icon: "💎", label: "Upgrade Plan", href: "/pricing",   active: false },
            { icon: "📜", label: "History",      href: "#history",   active: false },
            { icon: "⚙️", label: "Settings",     href: "#",          active: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? "gradient-purple text-white shadow-lg shadow-purple-600/25"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <SignOutButton redirectUrl="/login">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full mt-4">
            <span>🚪</span> Sign Out
          </button>
        </SignOutButton>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══ MAIN ══ */}
      <main className="flex-1 md:ml-[260px] p-5 md:p-10 min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-xl glass border border-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, <span className="gradient-text">{firstName}</span> 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Upload a product image and generate content instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition glass"
            >
              {isDark ? "🌞" : "🌙"}
            </button>
            <Link href="/pricing" className="hidden md:block btn-primary text-sm py-2 px-5">
              💎 Upgrade
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: "📊", label: "Plan",            value: "Free",    sub: "3 months" },
            { icon: "⏳", label: "Days Remaining",  value: "78",      sub: "days left" },
            { icon: "✨", label: "Posts Generated", value: "24",      sub: "this month" },
            { icon: "💳", label: "Credits Left",    value: "126",     sub: "/ 150 total" },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{stat.icon}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
              <p className="text-3xl font-extrabold gradient-text">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── GENERATOR ── */}
        <div className="card p-8 mb-10">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center text-lg shadow-md shadow-purple-600/30">✨</div>
            <div>
              <h2 className="text-xl font-bold">Sparkle Generator</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload → Configure → Generate</p>
            </div>
          </div>

          <div className="space-y-6">

            {/* Drop zone */}
            <div
              className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
                ${dragOver
                  ? "border-purple-500 bg-purple-500/10"
                  : image
                    ? "border-purple-500/40 bg-purple-500/5"
                    : "border-gray-300 dark:border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5"
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />

              {image ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={image}
                    alt="Product preview"
                    className="max-h-56 rounded-xl object-contain shadow-lg"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to change image
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl animate-float">📷</div>
                  <p className="text-lg font-semibold">Drop your product image here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse — JPG, PNG, WEBP up to 10 MB
                  </p>
                  <span className="btn-primary text-sm py-2 px-6 mt-2">Choose Image</span>
                </div>
              )}
            </div>

            {/* Options row */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Platform", value: platform, setter: setPlatform, opts: PLATFORMS, icon: "📱" },
                { label: "Tone",     value: tone,     setter: setTone,     opts: TONES,     icon: "🎨" },
                { label: "Language", value: language, setter: setLanguage, opts: LANGUAGES, icon: "🌍" },
              ].map(({ label, value, setter, opts, icon }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    {icon} {label}
                  </label>
                  <select
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10
                      bg-white/80 dark:bg-black/30 text-sm font-medium
                      focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500
                      transition-all cursor-pointer"
                  >
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fadeIn">
                <span className="text-base shrink-0">⚠️</span>
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !file}
              className={`btn-primary w-full py-4 text-base relative overflow-hidden
                ${loading || !file ? "opacity-60 cursor-not-allowed" : ""}
              `}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spinSlow" />
                  Generating your content...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ✨ Generate Content
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── RESULTS ── */}
        {(loading || result) && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold">
                {loading ? "Generating..." : "Your Content is Ready ✨"}
              </h2>
              {!loading && result && (
                <button
                  onClick={() => {
                    const all = RESULT_LABELS.map(({ label, key }) => {
                      const val = result![key];
                      return `${label}:\n${Array.isArray(val) ? val.join(" ") : val}`;
                    }).join("\n\n");
                    navigator.clipboard.writeText(all);
                  }}
                  className="ml-auto btn-secondary text-sm py-2 px-4"
                >
                  📋 Copy All
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {RESULT_LABELS.map(({ key, icon, label, color }, i) => (
                loading ? (
                  <div key={key} style={{ animationDelay: `${i * 0.1}s` }}>
                    <SkeletonCard />
                  </div>
                ) : result ? (
                  <div
                    key={key}
                    className={`result-card p-6 bg-gradient-to-br ${color}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                          {label}
                        </p>
                      </div>
                      <CopyButton
                        text={
                          Array.isArray(result[key])
                            ? (result[key] as string[]).join(" ")
                            : result[key] as string
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {key === "hashtags" && Array.isArray(result[key])
                        ? (result[key] as string[]).join(" ")
                        : result[key] as string}
                    </p>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {history.length > 0 && (
          <div id="history" className="card p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>📜</span> Recent Generations
            </h2>
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-purple-500/20 transition-all cursor-pointer"
                  onClick={() => setResult(item.result)}
                >
                  <img
                    src={item.imagePreview}
                    alt="product"
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.result.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.platform} · {item.tone} · {item.createdAt}
                    </p>
                  </div>
                  <span className="text-xs text-purple-400 font-medium shrink-0">View →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Banner */}
        <div className="mt-10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.12) 0%, rgba(124,58,237,0.08) 100%)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div>
            <p className="text-lg font-bold mb-1">Unlock unlimited generations 🚀</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You&apos;re on the Free plan. Upgrade to Pro for unlimited content, all platforms, and multi-language support.
            </p>
          </div>
          <Link href="/pricing" className="btn-primary shrink-0">
            💎 Upgrade to Pro
          </Link>
        </div>
      </main>
    </div>
  );
}