"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Basic email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Basic password validation
function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Validate inputs
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=Email and password are required");
  }

  if (!isValidEmail(email)) {
    redirect("/login?error=Please enter a valid email address");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);

    let errorMessage = "Could not authenticate user";

    // Map Supabase error messages to user-friendly messages
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please verify your email address before logging in";
    } else if (error.message.includes("Email rate limit exceeded")) {
      errorMessage = "Too many login attempts. Please try again later";
    } else if (error.message.includes("User not found")) {
      errorMessage = "No account found with this email";
    } else if (error.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address";
    }

    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // Validate inputs
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/signup?error=Email and password are required");
  }

  if (!isValidEmail(email)) {
    redirect("/signup?error=Please enter a valid email address");
  }

  if (!isValidPassword(password)) {
    redirect("/signup?error=Password must be at least 6 characters long");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Signup error:", error);

    let errorMessage = "Could not create user";

    // Map Supabase error messages to user-friendly messages
    if (error.message.includes("User already registered")) {
      errorMessage = "An account with this email already exists";
    } else if (error.message.includes("Password should be at least")) {
      errorMessage = "Password must be at least 6 characters long";
    } else if (error.message.includes("invalid format") || error.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address";
    } else if (error.message.includes("Email rate limit exceeded")) {
      errorMessage = "Too many signup attempts. Please try again later";
    } else if (error.message.includes("Signups not allowed")) {
      errorMessage = "Account creation is currently disabled";
    } else if (error.message.includes("Password is too weak")) {
      errorMessage = "Please choose a stronger password";
    }

    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/", "layout");
  redirect("/signup?message=Check your email to confirm your account");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  // Validate input
  if (!email) {
    redirect("/forgot-password?error=Email is required");
  }

  if (!isValidEmail(email)) {
    redirect("/forgot-password?error=Please enter a valid email address");
  }

  // Check if NEXT_PUBLIC_SITE_URL is configured
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    console.error("NEXT_PUBLIC_SITE_URL is not configured");
    redirect("/forgot-password?error=Server configuration error. Please contact support.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("Password reset error:", error);

    // Provide more specific error messages
    let errorMessage = "Could not send password reset email";

    if (error.message.includes("Email rate limit exceeded")) {
      errorMessage = "Too many requests. Please try again in a few minutes.";
    } else if (error.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address.";
    } else if (error.message.includes("not authorized")) {
      errorMessage = "Email service not configured. Please contact support.";
    }

    redirect(`/forgot-password?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/forgot-password", "page");
  redirect("/forgot-password?message=Check your email for a password reset link");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  // Validate input
  if (!password) {
    redirect("/update-password?error=Password is required");
  }

  if (!isValidPassword(password)) {
    redirect("/update-password?error=Password must be at least 6 characters long");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Password update error:", error);

    let errorMessage = "Could not update password";

    if (error.message.includes("Password should be at least")) {
      errorMessage = "Password must be at least 6 characters long.";
    } else if (error.message.includes("not authenticated")) {
      errorMessage = "Session expired. Please request a new password reset link.";
    }

    redirect(`/update-password?error=${encodeURIComponent(errorMessage)}`);
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=Password updated successfully. Please log in with your new password.");
}
