import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";
  const origin = requestUrl.origin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (oauthError) {
    return NextResponse.redirect(new URL("/login?error=access_denied", origin));
  }

  if (!supabaseUrl || !supabaseKey || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_config_or_code_missing", origin));
  }

  const cookieStore = await cookies();
  const authCookies: Array<{
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
        authCookies.push(...cookiesToSet);
      }
    }
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("[jec-auth-callback] Code exchange failed:", exchangeError.message);
    const response = NextResponse.redirect(new URL("/login?error=oauth_exchange_failed", origin));
    authCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("[jec-auth-callback] Session verification failed:", userError?.message ?? "No user returned");
    const response = NextResponse.redirect(new URL("/login?error=oauth_session_missing", origin));
    authCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("jec_memberships")
    .select("membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("[jec-auth-callback] Membership lookup failed:", membershipError.message);
  }

  const destination = new URL(next, origin);
  if (membership?.membership_status === "pending" || !membership?.membership_status) {
    destination.searchParams.set("membership", "pending");
  } else if (membership.membership_status === "rejected") {
    destination.searchParams.set("membership", "rejected");
  }

  // Copy the refreshed Supabase auth cookies onto the redirect response as well
  // as the Next.js cookie store, so the browser receives the session on Vercel.
  const response = NextResponse.redirect(destination);
  authCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
