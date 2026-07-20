import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

const UpdateBody = z.object({
  amount: z.coerce.number().nonnegative().optional(),
  costBasis: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const body = UpdateBody.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw errors.badRequest("invalid body", body.error.flatten());
    const patch: Record<string, unknown> = {};
    if (body.data.amount != null) patch.amount = body.data.amount;
    if (body.data.costBasis != null) patch.cost_basis = body.data.costBasis;
    if (body.data.notes !== undefined) patch.notes = body.data.notes;
    if (Object.keys(patch).length === 0) throw errors.badRequest("nothing to update");
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("holdings")
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
      .from("holdings")
      .delete()
      .eq("id", ctx.params.id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}


export const dynamic = "force-dynamic";
export const revalidate = 0;
