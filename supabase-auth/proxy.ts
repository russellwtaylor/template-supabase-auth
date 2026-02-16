import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
	return await updateSession(request);
}

export const config = {
	// Only run on routes that need session refresh or auth protection.
	// Add new protected or auth-related paths here when you add them.
	matcher: ["/", "/login", "/signup", "/dashboard", "/auth/:path*"],
};
