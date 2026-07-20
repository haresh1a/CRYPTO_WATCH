import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("id", ctx.params.id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}


export const dynamic = "force-dynamic";
export const revalidate = 0;
