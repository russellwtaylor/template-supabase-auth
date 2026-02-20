import type { NextConfig } from "next";

// Pull the Supabase hostname at build time for image optimization.
// NEXT_PUBLIC_* vars are inlined at build time so this is safe in next.config.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl
	? new URL(supabaseUrl).hostname
	: undefined;

const nextConfig: NextConfig = {
	// ---------------------------------------------------------------------------
	// Next.js Image optimization — allow avatars served from Supabase Storage.
	// ---------------------------------------------------------------------------
	images: {
		remotePatterns: supabaseHostname
			? [
					{
						protocol: "https",
						hostname: supabaseHostname,
						pathname: "/storage/v1/object/public/**",
					},
				]
			: [],
	},

	// ---------------------------------------------------------------------------
	// Security headers applied to every response.
	// ---------------------------------------------------------------------------
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					// Prevent the page from being loaded in a frame (clickjacking protection).
					{ key: "X-Frame-Options", value: "DENY" },

					// Prevent MIME-type sniffing.
					{ key: "X-Content-Type-Options", value: "nosniff" },

					// Only send the origin when navigating to a same-origin URL.
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},

					// Restrict browser feature access to only what the app needs.
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},

					// Force HTTPS for 1 year and include subdomains.
					// NOTE: Only add this header in production — a misconfigured
					// local HTTPS setup will lock you out of the site. Next.js
					// automatically strips it in development via its internal
					// header handling, but the explict env-guard below is safer.
					...(process.env.NODE_ENV === "production"
						? [
								{
									key: "Strict-Transport-Security",
									value: "max-age=31536000; includeSubDomains",
								},
							]
						: []),
				],
			},
		];
	},
};

export default nextConfig;
