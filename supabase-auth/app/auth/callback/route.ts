import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/login?error=Authentication failed. Please try again.`
      );
    }

    // Redirect to the next URL or dashboard
    return NextResponse.redirect(`${request.nextUrl.origin}${next}`);
  }

  // No code present, redirect to login with error
  return NextResponse.redirect(
    `${request.nextUrl.origin}/login?error=Authentication failed. Please try again.`
  );
}
