"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/login?error=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/signup?error=Could not create user");
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
