import { createClient } from "@/lib/supabase/server";
import {
	safeRedirectPath,
	isValidEmailOtpType,
} from "@/app/actions/utils";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type");
	const next = safeRedirectPath(searchParams.get("next"));

	if (token_hash && isValidEmailOtpType(type)) {
		const supabase = await createClient();

		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});

		if (!error) {
			redirect(next);
		}
	}

	redirect("/login?error=Could not verify email");
}
