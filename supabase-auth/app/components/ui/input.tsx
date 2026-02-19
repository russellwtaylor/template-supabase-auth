import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: boolean;
}

export function Input({ error, className, ...props }: InputProps) {
	return (
		<input
			className={[
				"block w-full rounded-md border px-3 py-2 text-sm",
				"bg-white text-zinc-900 placeholder-zinc-400",
				"focus:outline-none focus:ring-1",
				"dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500",
				error
					? "border-red-400 focus:border-red-400 focus:ring-red-400 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-500"
					: "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-zinc-400",
				className,
			]
				.filter(Boolean)
				.join(" ")}
			{...props}
		/>
	);
}
