import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    const { data: profile } = await session.from("profiles").select("role,active,nucleo").eq("id", user.id).maybeSingle();
    if (!profile?.active) return NextResponse.json({ error: "Tu cuenta no está activa." }, { status: 403 });
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Visita inválida." }, { status: 400 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel." }, { status: 500 });
    const admin = createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    let query = admin.from("visitas").select("id,nucleo,hora_entrada,hora_salida").eq("id", id);
    if (profile.role !== "admin") query = query.eq("nucleo", profile.nucleo);
    const { data: visit, error: visitError } = await query.maybeSingle();
    if (visitError || !visit) return NextResponse.json({ error: "No se encontró la visita en tu núcleo." }, { status: 404 });
    if (visit.hora_salida) return NextResponse.json({ error: "Esta visita ya tiene hora de salida registrada." }, { status: 409 });
    const now = new Date();
    const hora = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now);
    const { error } = await admin.from("visitas").update({ hora_salida: hora }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, hora_salida: hora });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar la hora de salida." }, { status: 500 });
  }
}
