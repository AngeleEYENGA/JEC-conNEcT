import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOURCES = [
  {
    id: "jec-france",
    name: "JEC France",
    hostname: "jecfrance.org",
    language: "fr",
    endpoint: "https://jecfrance.org/wp-json/wp/v2/posts?per_page=8&orderby=date&order=desc&_fields=id,date,link,title,excerpt"
  },
  {
    id: "jeci-miec",
    name: "JECI-MIEC (Europe)",
    hostname: "www.jecimiec.eu",
    language: "en",
    endpoint: "https://www.jecimiec.eu/wp-json/wp/v2/posts?per_page=8&orderby=date&order=desc&_fields=id,date,link,title,excerpt"
  }
] as const;

type WordPressPost = {
  id?: number;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
};

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&", apos: "'", quot: "\"",
    nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
    ndash: "–", mdash: "—", hellip: "…", eacute: "é", egrave: "è",
    agrave: "à", ccedil: "ç", ecirc: "ê", bull: "•"
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_match, digits: string) => {
      const code = Number.parseInt(digits, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function plainText(value: string | undefined, maxLength: number): string {
  return decodeEntities((value ?? "")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()).slice(0, maxLength);
}

async function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { error: NextResponse.json({ error: "Le service d’authentification n’est pas configuré." }, { status: 503 }) };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Certains contextes serveur ne permettent pas de modifier les cookies.
        }
      }
    }
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: NextResponse.json({ error: "Connexion administrateur requise." }, { status: 401 }) };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_jec_admin");
  if (adminError || isAdmin !== true) {
    return { error: NextResponse.json({ error: "Accès réservé aux administrateurs JEC." }, { status: 403 }) };
  }

  return { supabase };
}

export async function GET() {
  const access = await getAdmin();
  if ("error" in access) return access.error;

  const results = await Promise.all(SOURCES.map(async (source) => {
    try {
      const response = await fetch(source.endpoint, {
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "JEC-Connect-Editorial/1.0" },
        signal: AbortSignal.timeout(9000)
      });
      if (!response.ok) throw new Error("HTTP " + response.status);

      const payload = await response.json() as WordPressPost[];
      if (!Array.isArray(payload)) throw new Error("Réponse de source invalide.");

      const items = payload.flatMap((post) => {
        if (!post.link || !post.date || !post.title?.rendered) return [];
        let articleUrl: URL;
        try {
          articleUrl = new URL(post.link);
        } catch {
          return [];
        }
        if (articleUrl.protocol !== "https:" || articleUrl.hostname !== source.hostname) return [];

        const publishedDate = post.date.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedDate) || Number.isNaN(Date.parse(publishedDate))) return [];
        const title = plainText(post.title.rendered, 220);
        if (!title) return [];

        return [{
          id: source.id + "-" + String(post.id ?? articleUrl.pathname),
          sourceId: source.id,
          sourceName: source.name,
          sourceLanguage: source.language,
          title,
          excerpt: plainText(post.excerpt?.rendered, 1800),
          url: articleUrl.toString(),
          publishedDate
        }];
      });

      return { sourceId: source.id, sourceName: source.name, ok: true, count: items.length, items };
    } catch (error) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        ok: false,
        count: 0,
        items: [],
        error: error instanceof Error ? error.message : "Source indisponible"
      };
    }
  }));

  const items = results
    .flatMap((result) => result.items)
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
    .slice(0, 16);

  return NextResponse.json({
    items,
    sources: results.map(({ items: _items, ...source }) => source),
    checkedAt: new Date().toISOString()
  }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
}
