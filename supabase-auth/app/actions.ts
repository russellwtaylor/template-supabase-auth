"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      errorMessage = "Invalid email or password. If you signed up with Google, use the Google button above.";
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

  // Check if MFA verification is required
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
    redirect("/mfa");
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
      errorMessage = "An account with this email already exists. Try signing in, or use Google if that's how you registered.";
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

// Re-throw errors thrown by redirect() so Next.js can perform the redirect.
// redirect() throws internally; catching it without re-throwing swallows the navigation.
function rethrowIfRedirect(err: unknown): void {
  if (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw err;
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const full_name = (formData.get("full_name") as string)?.trim() ?? "";

    if (full_name.length > 100) {
      redirect(`/profile?nameError=${encodeURIComponent("Display name must be 100 characters or fewer")}`);
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Profile update error:", error);
      redirect(`/profile?nameError=${encodeURIComponent("Could not update profile")}`);
    }

    redirect("/profile?message=Profile updated successfully");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in updateProfile:", err);
    redirect(`/profile?nameError=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}

export async function updateEmail(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const email = formData.get("email") as string;

    if (!email) {
      redirect(`/profile?emailError=${encodeURIComponent("Email is required")}`);
    }

    if (!isValidEmail(email)) {
      redirect(`/profile?emailError=${encodeURIComponent("Please enter a valid email address")}`);
    }

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      console.error("Email update error:", error);

      let errorMessage = "Could not update email";

      if (error.message.includes("already registered") || error.message.includes("already in use")) {
        errorMessage = "This email address is already in use";
      } else if (error.message.includes("Email rate limit exceeded") || error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please try again later.";
      }

      redirect(`/profile?emailError=${encodeURIComponent(errorMessage)}`);
    }

    redirect("/profile?message=Check your inbox to confirm your new email address");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in updateEmail:", err);
    redirect(`/profile?emailError=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Avatar update error:", error);
  }

  revalidatePath("/profile", "page");
}

export async function updatePhone(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const raw = (formData.get("phone") as string)?.trim() ?? "";

    // Allow clearing the phone number
    if (raw !== "") {
      // Strip formatting characters and count digits
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        redirect(`/profile?phoneError=${encodeURIComponent("Please enter a valid phone number (7\u201315 digits)")}`);
      }
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      phone: raw || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Phone update error:", error);
      redirect(`/profile?phoneError=${encodeURIComponent("Could not update phone number")}`);
    }

    redirect("/profile?message=Phone number saved");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in updatePhone:", err);
    redirect(`/profile?phoneError=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}

export async function sendPasswordReset() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error("NEXT_PUBLIC_SITE_URL is not configured");
      redirect(`/profile?error=${encodeURIComponent("Server configuration error. Please contact support.")}`);
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Could not send password reset email";

      if (error.message.includes("Email rate limit exceeded") || error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please try again in a few minutes.";
      }

      redirect(`/profile?error=${encodeURIComponent(errorMessage)}`);
    }

    redirect("/profile?message=Password reset link sent. Check your email.");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in sendPasswordReset:", err);
    redirect(`/profile?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
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

export async function revokeSession(sessionId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { error } = await supabase.rpc("delete_user_session", {
      session_id: sessionId,
    });

    if (error) {
      console.error("Session revocation error:", error);
      redirect(`/profile/sessions?error=${encodeURIComponent("Could not revoke session. Please try again.")}`);
    }

    redirect("/profile/sessions?message=Session revoked successfully");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in revokeSession:", err);
    redirect(`/profile/sessions?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}

export async function revokeOtherSessions() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { error } = await supabase.auth.signOut({ scope: "others" });

    if (error) {
      console.error("Sign out others error:", error);
      redirect(`/profile/sessions?error=${encodeURIComponent("Could not sign out other sessions. Please try again.")}`);
    }

    redirect("/profile/sessions?message=Signed out of all other sessions");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in revokeOtherSessions:", err);
    redirect(`/profile/sessions?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}

export async function deleteAccount() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Account deletion error:", error);
      redirect(`/profile?error=${encodeURIComponent("Could not delete account. Please try again.")}`);
    }

    // Sign out the session after deletion
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login?message=Your account has been permanently deleted.");
  } catch (err) {
    rethrowIfRedirect(err);
    console.error("Unexpected error in deleteAccount:", err);
    redirect(`/profile?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`);
  }
}
