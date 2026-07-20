import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

const UpdateBody = z.object({
  markPrice: z.coerce.number().positive().optional(),
  closePrice: z.coerce.number().positive().optional(),
  close: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const body = UpdateBody.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw errors.badRequest("invalid body", body.error.flatten());
    const supabase = getServerSupabase();

    // Read current row so we can compute realised PnL on close.
    const { data: current, error: readErr } = await supabase
      .from("futures_positions")
      .select("*")
      .eq("id", ctx.params.id)
      .eq("user_id", user.id)
      .single();
    if (readErr || !current) throw errors.notFound("position not found");

    const patch: Record<string, unknown> = {};
    if (body.data.markPrice != null) patch.mark_price = body.data.markPrice;
    if (body.data.notes !== undefined) patch.notes = body.data.notes;
    if (body.data.close === true || body.data.closePrice != null) {
      const closePrice = body.data.closePrice ?? body.data.markPrice;
      if (!closePrice) throw errors.badRequest("closePrice or markPrice required to close");
      patch.close_price = closePrice;
      patch.closed = true;
      patch.closed_at = new Date().toISOString();
      const dir = current.side === "long" ? 1 : -1;
      const pnl = (Number(closePrice) - Number(current.entry_price)) * Number(current.size) * dir;
      patch.realized_pnl = pnl;
    }

    const { error } = await supabase
      .from("futures_positions")
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
      .from("futures_positions")
      .delete()
      .eq("id", ctx.params.id)
      .eq("user_id", user.id);
    if (error) throw errors.internal(error.message);
    return { ok: true };
  });
}


export const dynamic = "force-dynamic";
export const revalidate = 0;
