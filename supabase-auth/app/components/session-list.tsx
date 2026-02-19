"use client";

import { useState } from "react";
import { revokeSession, revokeOtherSessions } from "@/app/actions";

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function parseUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  // Try to extract browser and OS
  const browsers: [RegExp, string][] = [
    [/Edg\//, "Edge"],
    [/OPR\/|Opera\//, "Opera"],
    [/Firefox\//, "Firefox"],
    [/Chrome\//, "Chrome"],
    [/Safari\//, "Safari"],
  ];
  const oses: [RegExp, string][] = [
    [/Windows NT/, "Windows"],
    [/Macintosh|Mac OS X/, "macOS"],
    [/Linux/, "Linux"],
    [/Android/, "Android"],
    [/iPhone|iPad/, "iOS"],
  ];
  let browser: string | null = null;
  for (const [re, name] of browsers) {
    if (re.test(ua)) { browser = name; break; }
  }
  let os: string | null = null;
  for (const [re, name] of oses) {
    if (re.test(ua)) { os = name; break; }
  }
  if (browser && os) return `${browser} on ${os}`;
  if (browser) return browser;
  if (os) return os;
  return ua;
}

interface Props {
  sessions: Session[];
  currentSessionId: string | null;
}

export default function SessionList({ sessions, currentSessionId }: Props) {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const isPending = revokingId === session.id;
          const deviceLabel = parseUserAgent(session.user_agent);

          return (
            <div
              key={session.id}
              className="rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    {deviceLabel && (
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {deviceLabel}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        This device
                      </span>
                    )}
                  </div>
                  {session.ip && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {session.ip}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Started {formatDate(session.created_at)} · Active {formatRelative(session.updated_at)}
                  </p>
                </div>
                {!isCurrent && (
                  <form
                    action={async () => {
                      setRevokingId(session.id);
                      await revokeSession(session.id);
                    }}
                    className="shrink-0"
                  >
                    <button
                      type="submit"
                      disabled={isPending || revokingOthers}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {isPending ? "Revoking…" : "Revoke"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {otherSessions.length > 0 && (
        <form
          action={async () => {
            setRevokingOthers(true);
            await revokeOtherSessions();
          }}
        >
          <button
            type="submit"
            disabled={revokingOthers || revokingId !== null}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {revokingOthers ? "Signing out…" : "Sign out all other sessions"}
          </button>
        </form>
      )}
    </div>
  );
}
