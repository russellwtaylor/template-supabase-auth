"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	MIN_PASSWORD_LENGTH,
	isValidEmail,
	isValidPassword,
	mapSupabaseError,
	redirectWithError,
} from "./utils";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

const LOGIN_ERROR_MAP: Array<[string, string]> = [
	[
		"Invalid login credentials",
		"Invalid email or password. If you signed up with Google, use the Google button above.",
	],
	[
		"Email not confirmed",
		"Please verify your email address before logging in",
	],
	[
		"Email rate limit exceeded",
		"Too many login attempts. Please try again later",
	],
	// "User not found" intentionally maps to the same message as invalid
	// credentials to prevent account enumeration (leaking whether an email
	// address is registered).
	[
		"User not found",
		"Invalid email or password. If you signed up with Google, use the Google button above.",
	],
	["Invalid email", "Please enter a valid email address"],
];

export async function login(formData: FormData) {
	const supabase = await createClient();

	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	if (!email || !password) {
		redirectWithError("/login", "error", "Email and password are required");
	}

	if (!isValidEmail(email)) {
		redirectWithError(
			"/login",
			"error",
			"Please enter a valid email address",
		);
	}

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		console.error("Login error:", error);
		const message = mapSupabaseError(
			error,
			"Could not authenticate user",
			LOGIN_ERROR_MAP,
		);
		redirectWithError("/login", "error", message);
	}

	const { data: aalData } =
		await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
	if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
		redirect("/mfa");
	}

	revalidatePath("/", "layout");
	redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

const SIGNUP_ERROR_MAP: Array<[string, string]> = [
	[
		"User already registered",
		"An account with this email already exists. Try signing in, or use Google if that's how you registered.",
	],
	[
		"Password should be at least",
		`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
	],
	["invalid format", "Please enter a valid email address"],
	["Invalid email", "Please enter a valid email address"],
	[
		"Email rate limit exceeded",
		"Too many signup attempts. Please try again later",
	],
	["Signups not allowed", "Account creation is currently disabled"],
	["Password is too weak", "Please choose a stronger password"],
];

export async function signup(formData: FormData) {
	const supabase = await createClient();

	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;

	if (!email || !password) {
		redirectWithError(
			"/signup",
			"error",
			"Email and password are required",
		);
	}

	if (!isValidEmail(email)) {
		redirectWithError(
			"/signup",
			"error",
			"Please enter a valid email address",
		);
	}

	if (!isValidPassword(password)) {
		redirectWithError(
			"/signup",
			"error",
			`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
		);
	}

	if (password !== confirmPassword) {
		redirectWithError("/signup", "error", "Passwords do not match");
	}

	const { error } = await supabase.auth.signUp({ email, password });

	if (error) {
		console.error("Signup error:", error);
		const message = mapSupabaseError(
			error,
			"Could not create user",
			SIGNUP_ERROR_MAP,
		);
		redirectWithError("/signup", "error", message);
	}

	revalidatePath("/", "layout");
	redirect("/signup?message=Check your email to confirm your account");
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signout() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	revalidatePath("/", "layout");
	redirect("/login");
}
