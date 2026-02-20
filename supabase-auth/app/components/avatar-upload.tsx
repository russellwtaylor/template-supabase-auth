"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/app/actions";

interface AvatarUploadProps {
	currentUrl: string | null;
	userId: string;
}

export default function AvatarUpload({
	currentUrl,
	userId,
}: AvatarUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const ALLOWED_TYPES = new Set([
			"image/png",
			"image/jpeg",
			"image/webp",
		]);
		if (!ALLOWED_TYPES.has(file.type)) {
			setError("Only PNG, JPG, and WebP images are allowed");
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			setError("File must be smaller than 2MB");
			return;
		}

		setError(null);
		setUploading(true);

		const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
		const path = `${userId}/${crypto.randomUUID()}.${ext}`;

		const supabase = createClient();
		const { data, error: uploadError } = await supabase.storage
			.from("avatars")
			.upload(path, file, { upsert: true });

		if (uploadError) {
			console.error("Avatar upload error:", uploadError);
			setError("Failed to upload image. Please try again.");
			setUploading(false);
			return;
		}

		const { data: urlData } = supabase.storage
			.from("avatars")
			.getPublicUrl(data.path);
		const publicUrl = urlData.publicUrl;

		await updateAvatar(publicUrl);
		setPreviewUrl(publicUrl);
		setUploading(false);
	}

	const initials = userId.slice(0, 2).toUpperCase();

	return (
		<div className="flex flex-col items-center gap-3">
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				disabled={uploading}
				className="relative h-24 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700 hover:opacity-80 transition-opacity disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
				aria-label="Upload avatar"
			>
				{previewUrl ? (
					<Image
						src={previewUrl}
						alt="Avatar"
						fill
						sizes="96px"
						className="object-cover"
					/>
				) : (
					<span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-500 dark:text-zinc-300">
						{initials}
					</span>
				)}
				{uploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40">
						<svg
							className="h-6 w-6 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							/>
						</svg>
					</div>
				)}
			</button>
			<p className="text-xs text-zinc-500 dark:text-zinc-400">
				{uploading
					? "Uploading…"
					: "Click to upload (PNG, JPG, WebP, max 2MB)"}
			</p>
			{error && (
				<p className="text-xs text-red-600 dark:text-red-400">
					{error}
				</p>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				className="hidden"
				onChange={handleFileChange}
			/>
		</div>
	);
}
