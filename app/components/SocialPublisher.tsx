"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";

export interface PublishableContent {
  record_id?: string;
  image_url?: string;
  caption: string;
  hashtags: string[];
}

interface SocialAccount {
  id: string;
  provider: "instagram" | "facebook";
  provider_account_id: string;
  account_name: string;
  status: "connected" | "reconnect_required";
}

interface PublishJob {
  id: string;
  provider: "instagram" | "facebook";
  status: "pending" | "processing" | "published" | "failed";
  caption: string;
  hashtags: string[];
  error_message?: string;
  created_at: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || "Request failed. Please try again.");
  return data as T;
}

export default function SocialPublisher({ content, imagePreview }: { content: PublishableContent; imagePreview: string }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [caption, setCaption] = useState(content.caption);
  const [hashtags, setHashtags] = useState(content.hashtags.join(" "));
  const [job, setJob] = useState<PublishJob | null>(null);
  const [history, setHistory] = useState<PublishJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const api = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const token = await getToken();
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return request<T>(url, { ...init, headers });
  }, [getToken]);

  const loadData = useCallback(async () => {
    const [accountRows, historyRows] = await Promise.all([
      api<SocialAccount[]>("/api/social/accounts"),
      api<PublishJob[]>("/api/social/publish-history"),
    ]);
    const instagramAccounts = accountRows.filter((account) => account.provider === "instagram");
    setAccounts(instagramAccounts);
    setHistory(historyRows);
    setSelectedAccount((current) => current || instagramAccounts.find((item) => item.status === "connected")?.id || "");
  }, [api]);

  useEffect(() => {
    void loadData().catch(() => undefined);
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("social_error");
    if (oauthError) setError(oauthError);
    if (params.has("social_connected")) void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!job || !["pending", "processing"].includes(job.status)) return;
    const timer = window.setInterval(() => {
      void api<PublishJob>(`/api/social/publish/${job.id}`)
        .then((next) => {
          setJob(next);
          if (["published", "failed"].includes(next.status)) void loadData();
        })
        .catch((err: Error) => setError(err.message));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [job, loadData]);

  const selected = useMemo(
    () => accounts.find((account) => account.id === selectedAccount),
    [accounts, selectedAccount]
  );

  const connectInstagram = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await api<{ authorization_url: string }>("/api/social/accounts/instagram/connect", { method: "POST" });
      window.location.assign(response.authorization_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start account connection.");
      setBusy(false);
    }
  };

  const disconnect = async (accountId: string) => {
    setBusy(true);
    try {
      await api(`/api/social/accounts/${accountId}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect the account.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!content.record_id || !selectedAccount) return;
    setBusy(true);
    setError("");
    try {
      const created = await api<PublishJob>("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generated_content_id: content.record_id,
          social_account_id: selectedAccount,
          caption,
          hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
          idempotency_key: crypto.randomUUID(),
        }),
      });
      setJob(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing could not be started.");
    } finally {
      setBusy(false);
    }
  };

  if (!content.record_id) {
    return <p className="mt-4 text-sm text-amber-500">Regenerate this item to make it available for publishing.</p>;
  }

  return (
    <section className="mt-6">
      <button className="btn-primary" onClick={() => setOpen((value) => !value)}>
        {open ? "Close Instagram publisher" : "Publish on Instagram"}
      </button>

      {open && (
        <div className="mt-4 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white/70 dark:bg-black/20">
          <div className="grid lg:grid-cols-[280px_1fr]">
            <div className="p-5 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10">
              <Image
                src={content.image_url || imagePreview}
                alt="Product to publish"
                width={640}
                height={640}
                unoptimized
                className="w-full aspect-square object-cover rounded-xl"
              />
              <p className="mt-4 text-xs font-semibold uppercase text-gray-500">Connected accounts</p>
              <div className="mt-2 space-y-2">
                {accounts.map((account) => (
                  <label key={account.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="radio"
                      name="social-account"
                      checked={selectedAccount === account.id}
                      onChange={() => setSelectedAccount(account.id)}
                      disabled={account.status !== "connected"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{account.account_name}</span>
                      <span className="block text-xs capitalize text-gray-500">{account.provider.replace("instagram", "Instagram")}</span>
                    </span>
                    <button type="button" className="text-xs text-red-400" onClick={() => void disconnect(account.id)}>Disconnect</button>
                  </label>
                ))}
              </div>
              <button className="btn-secondary text-xs px-3 mt-3" disabled={busy} onClick={() => void connectInstagram()}>
                {busy ? "Connecting..." : "Connect Instagram"}
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">Caption</span>
                <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={7} maxLength={2200} className="mt-2 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 p-3 text-sm resize-y" />
                <span className="block text-right text-xs text-gray-500">{caption.length}/2200</span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">Hashtags</span>
                <input value={hashtags} onChange={(event) => setHashtags(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 p-3 text-sm" />
              </label>

              {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              {job && (
                <div className={`p-3 rounded-xl border text-sm ${job.status === "published" ? "bg-green-500/10 border-green-500/20 text-green-500" : job.status === "failed" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}>
                  {job.status === "published" && "Published successfully."}
                  {job.status === "failed" && (job.error_message || "Publishing failed. Reconnect the account and try again.")}
                  {["pending", "processing"].includes(job.status) && "Publishing in progress..."}
                </div>
              )}

              <button className="btn-primary w-full" disabled={busy || !selected || !caption.trim() || selected.status !== "connected"} onClick={() => void publish()}>
                {busy ? "Please wait..." : selected ? "Publish to Instagram" : "Select a connected Instagram account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Publishing history</h3>
          <div className="divide-y divide-gray-200 dark:divide-white/10 border border-gray-200 dark:border-white/10 rounded-xl">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3 text-sm">
                <span className="capitalize">{item.provider}</span>
                <span className="truncate flex-1 text-gray-500">{item.caption}</span>
                <span className={item.status === "published" ? "text-green-500" : item.status === "failed" ? "text-red-400" : "text-amber-500"}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
