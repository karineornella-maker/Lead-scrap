import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Revérifie l'utilisateur côté serveur (à appeler dans chaque Server Action). */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
