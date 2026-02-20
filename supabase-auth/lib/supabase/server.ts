import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing ${name} environment variable`);
	return value;
}

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient(
		getEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have proxy refreshing
						// user sessions.
					}
				},
			},
		},
	);
}
