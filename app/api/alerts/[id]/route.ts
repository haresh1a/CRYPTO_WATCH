import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = {};
    if (typeof body.active === "boolean") patch.active = body.active;
    if (Object.keys(patch).length === 0) throw errors.badRequest("nothing to update");
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("alerts")
      .update(patch)
      .eq("id", ctx.params.id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", ctx.params.id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}


export const dynamic = "force-dynamic";
export const revalidate = 0;
