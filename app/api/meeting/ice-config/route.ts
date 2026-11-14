import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function parseTurnUrls(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    // Comma-separated URLs are also accepted for simple Vercel environment values.
  }
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

export async function GET(request: NextRequest) {
  const meetingId = request.nextUrl.searchParams.get("meetingId");
  if (!meetingId) return NextResponse.json({ error: "meetingId is required" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Authentication service is not configured" }, { status: 503 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: cookiesToSet => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    }
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data: participant, error: participantError } = await supabase
    .from("jec_meeting_participants")
    .select("attendance_status")
    .eq("meeting_id", meetingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (participantError) return NextResponse.json({ error: "Unable to check meeting access" }, { status: 403 });
  if (!participant || !["accepted", "attended"].includes(participant.attendance_status)) {
    return NextResponse.json({ error: "Accepted meeting access required" }, { status: 403 });
  }

  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" }
  ];

  const turnUrls = parseTurnUrls(process.env.TURN_SERVER_URLS);
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;
  const relayAvailable = turnUrls.length > 0 && Boolean(turnUsername && turnCredential);

  if (relayAvailable) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential
    });
  }

  return NextResponse.json(
    { iceServers, relayAvailable },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
