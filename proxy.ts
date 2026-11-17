import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // Verify the cookie-backed session before rendering protected application routes.
  // Database RLS and RPC authorization remain the source of truth for data access.
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  const pathname = request.nextUrl.pathname;
  const matchesPath = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + "/");

  const requiresSignIn = [
    "/compte",
    "/workspace",
    "/messagerie",
    "/reunions",
    "/decisions",
    "/projets",
    "/documents",
    "/gestion",
    "/partenaires"
  ].some(matchesPath);

  if (requiresSignIn && !claims) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);

    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  // Do not rely on hidden navigation as an access-control mechanism.
  // Collaboration routes require a verified JEC membership (or a platform admin).
  const isMemberArea = [
    "/workspace",
    "/messagerie",
    "/reunions",
    "/decisions",
    "/projets",
    "/documents",
    "/partenaires"
  ].some(matchesPath);
  const isAdminArea = matchesPath("/gestion");

  if ((isMemberArea || isAdminArea) && claims) {
    const userId = typeof claims.sub === "string" ? claims.sub : null;
    const [{ data: membershipRows, error: membershipError }, { data: adminFlag, error: adminError }] =
      await Promise.all([
        userId
          ? supabase
              .from("jec_memberships")
              .select("user_id")
              .eq("user_id", userId)
              .eq("membership_status", "verified")
              .limit(1)
          : Promise.resolve({ data: null, error: new Error("Missing authenticated user id") }),
        supabase.rpc("is_jec_admin")
      ]);

    const isVerifiedMember = !membershipError && Array.isArray(membershipRows) && membershipRows.length > 0;
    const isPlatformAdmin = !adminError && adminFlag === true;
    const isAllowed = isAdminArea ? isPlatformAdmin : isVerifiedMember || isPlatformAdmin;

    if (!isAllowed) {
      // Redirect to the public portal; the account page remains available to signed-in users.
      const publicResponse = NextResponse.redirect(new URL("/", request.url));
      response.cookies.getAll().forEach((cookie) => publicResponse.cookies.set(cookie));
      return publicResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
