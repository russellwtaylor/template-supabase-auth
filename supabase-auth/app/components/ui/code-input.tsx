"use client";

interface CodeInputProps {
	value: string;
	onChange: (value: string) => void;
	autoFocus?: boolean;
}

export default function CodeInput({
	value,
	onChange,
	autoFocus = false,
}: CodeInputProps) {
	return (
		<div className="space-y-1">
			<label htmlFor="totp-code" className="sr-only">
				Authentication code
			</label>
			<input
				id="totp-code"
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				maxLength={6}
				value={value}
				onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
				placeholder="000000"
				autoComplete="one-time-code"
				autoFocus={autoFocus}
				className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-lg tracking-widest text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
			/>
		</div>
	);
}
