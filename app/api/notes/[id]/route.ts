import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

const UpdateBody = z.object({
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(1).max(20_000).optional(),
  tags: z.array(z.string().min(1).max(20)).max(8).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const body = UpdateBody.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw errors.badRequest("invalid body", body.error.flatten());
    const patch: Record<string, unknown> = {};
    if (body.data.title !== undefined) patch.title = body.data.title;
    if (body.data.body != null) patch.body = body.data.body;
    if (body.data.tags) patch.tags = body.data.tags;
    if (Object.keys(patch).length === 0) throw errors.badRequest("nothing to update");
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("notes")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}


export const dynamic = "force-dynamic";
export const revalidate = 0;
