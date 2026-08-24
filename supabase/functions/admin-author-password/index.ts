import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const authorId = String(body.author_id ?? "").trim();
    const password = String(body.password ?? "");
    if (!authorId) return json({ error: "author_id is required" }, 400);
    if (password.length < 8 || password.length > 72) {
      return json({ error: "Password must be 8-72 characters" }, 400);
    }

    const admin = createClient(url, service, { auth: { persistSession: false } });

    const { data: author, error: aErr } = await admin
      .from("blog_authors")
      .select("id, user_id, email, display_name")
      .eq("id", authorId)
      .maybeSingle();
    if (aErr) return json({ error: aErr.message }, 400);
    if (!author) return json({ error: "Author not found" }, 404);

    let userId = author.user_id as string | null;
    let created = false;

    if (!userId) {
      const email = (author.email ?? "").trim().toLowerCase();
      if (!email) return json({ error: "Add an email to this author first" }, 400);

      // Reuse an existing account with that email if present
      const { data: existingProfile } = await admin
        .from("profiles").select("user_id").ilike("email", email).maybeSingle();

      if (existingProfile?.user_id) {
        userId = existingProfile.user_id as string;
      } else {
        const { data: createdUser, error: cErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: author.display_name },
        });
        if (cErr) return json({ error: cErr.message }, 400);
        userId = createdUser.user!.id;
        created = true;
      }

      await admin.from("blog_authors").update({ user_id: userId }).eq("id", author.id);
      await admin.from("user_roles").insert({ user_id: userId, role: "author" }).select().maybeSingle();
    }

    if (!created) {
      const { error: uErr } = await admin.auth.admin.updateUserById(userId!, { password });
      if (uErr) return json({ error: uErr.message }, 400);
    }

    const { data: authUser } = await admin.auth.admin.getUserById(userId!);

    return json({
      success: true,
      created,
      email: authUser?.user?.email ?? author.email,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
