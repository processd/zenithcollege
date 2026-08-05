import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public: time-limited signed download link for a stored document. */
export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc } = await supabaseAdmin
      .from("documents")
      .select("file_path, file_name, is_published")
      .eq("id", data.id)
      .maybeSingle();

    if (!doc || !doc.is_published) throw new Error("This document is not available.");

    const { data: signed, error } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60 * 10, { download: doc.file_name });

    if (error || !signed) throw new Error("Could not prepare the download link.");
    return { url: signed.signedUrl };
  });
