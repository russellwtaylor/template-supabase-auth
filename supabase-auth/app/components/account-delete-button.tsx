"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/actions";

export default function AccountDeleteButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <p className="text-sm text-red-700 dark:text-red-300">
        This will permanently delete your account and all associated data. This
        action cannot be undone.
      </p>
      <div className="flex gap-3">
        <form
          action={async () => {
            setPending(true);
            await deleteAccount();
          }}
          className="flex-1"
        >
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Yes, delete my account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
