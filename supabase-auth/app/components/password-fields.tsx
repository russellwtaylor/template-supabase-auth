"use client";

import { useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

interface PasswordFieldsProps {
	/** Label for the primary password field */
	label?: string;
	/** Whether to auto-focus the first field */
	autoFocus?: boolean;
}

export default function PasswordFields({
	label = "Password",
	autoFocus = false,
}: PasswordFieldsProps) {
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");

	const hasMinLength = password.length >= MIN_PASSWORD_LENGTH;
	const passwordsMatch = password.length > 0 && password === confirm;
	const showMismatch = confirm.length > 0 && !passwordsMatch;

	return (
		<>
			<div className="space-y-2">
				<label
					htmlFor="password"
					className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
				>
					{label}
				</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minLength={MIN_PASSWORD_LENGTH}
					autoFocus={autoFocus}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
					placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
				/>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="confirmPassword"
					className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
				>
					Confirm password
				</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minLength={MIN_PASSWORD_LENGTH}
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
					className={[
						"w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500",
						showMismatch
							? "border-red-400 focus:border-red-400 focus:ring-red-400 dark:border-red-600"
							: "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700",
					].join(" ")}
					placeholder="Re-enter your password"
				/>
				{showMismatch && (
					<p className="text-xs text-red-600 dark:text-red-400">
						Passwords do not match
					</p>
				)}
			</div>

			{/* Requirements checklist */}
			<ul className="space-y-1 text-xs" aria-label="Password requirements">
				<Requirement met={hasMinLength}>
					At least {MIN_PASSWORD_LENGTH} characters
				</Requirement>
				<Requirement met={passwordsMatch}>
					Passwords match
				</Requirement>
			</ul>
		</>
	);
}

function Requirement({
	met,
	children,
}: {
	met: boolean;
	children: React.ReactNode;
}) {
	return (
		<li className="flex items-center gap-1.5">
			{met ? (
				<svg
					className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M5 13l4 4L19 7"
					/>
				</svg>
			) : (
				<svg
					className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9" strokeWidth={2} />
				</svg>
			)}
			<span
				className={
					met
						? "text-green-700 dark:text-green-400"
						: "text-zinc-500 dark:text-zinc-400"
				}
			>
				{children}
			</span>
		</li>
	);
}
