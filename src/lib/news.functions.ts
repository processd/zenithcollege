import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/** Public, read-only list of published college announcements. */
export const listPublishedNews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data } = await (client as any)
      .from("news_posts")
      .select("id, title, body, category, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(30);
    return (data ?? []) as {
      id: string;
      title: string;
      body: string;
      category: string;
      published_at: string | null;
    }[];
  } catch {
    return [];
  }
});
