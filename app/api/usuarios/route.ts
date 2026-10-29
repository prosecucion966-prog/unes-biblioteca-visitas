import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

const NUCLEOS = [
  "LA GUAIRA","CEFE CARMEN DE URIA","CARACAS","JUNQUITO","HELICOIDE","SAN PEDRO- COMUNAL","SENAMECF","EL LLANITO","CAFETAL","EJE ALTOS MIRANDINOS","EJE VALLES DEL TUY","EJE BARLOVENTO","EJE METROPOLITANO","EJE GUARENAS - GUATIRE","ARAGUA","CARABOBO","YARACUY","FALCÓN","LARA","EJE LA GUAJIRA","ZULIA","APURE","BARINAS","COJEDES TINAQUILLO","COJEDES","GUÁRICO","PORTUGUESA","MÉRIDA","TÁCHIRA","TRUJILLO","ANZOÁTEGUI","MONAGAS","NUEVA ESPARTA","CARUPANO","SUCRE","AMAZONAS","BOLÍVAR - PTO. ORDAZ","BOLÍVAR - ANGOSTURA","DELTA AMACURO"
];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role,active").eq("id", user.id).maybeSingle();
  if (!profile?.active || profile.role !== "admin") return { error: NextResponse.json({ error: "Solo el administrador puede gestionar usuarios." }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: NextResponse.json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel (solo servidor)." }, { status: 500 }) };
  const admin = createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return { admin };
}

export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  const { data: profiles, error } = await result.admin.from("profiles").select("id,full_name,role,active,nucleo,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: usersData, error: usersError } = await result.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
  const emails = new Map((usersData.users ?? []).map(u => [u.id, u.email ?? ""]));
  return NextResponse.json({ users: (profiles ?? []).map(p => ({ ...p, email: emails.get(p.id) ?? "" })) });
}

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  let body: { email?: string; password?: string; full_name?: string; nucleo?: string; role?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const full_name = String(body.full_name ?? "").trim();
  const role = body.role === "admin" ? "admin" : "operator";
  const nucleo = String(body.nucleo ?? "").trim();
  if (!email || !full_name || password.length < 10) return NextResponse.json({ error: "Indica nombre, correo y una contraseña de al menos 10 caracteres." }, { status: 400 });
  if (role === "operator" && !NUCLEOS.includes(nucleo)) return NextResponse.json({ error: "Selecciona un núcleo válido para el operador." }, { status: 400 });
  const { data: created, error: createError } = await result.admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "No se pudo crear el usuario." }, { status: 400 });
  const { error: profileError } = await result.admin.from("profiles").insert({ id: created.user.id, full_name, role, active: true, nucleo: role === "admin" ? null : nucleo });
  if (profileError) {
    await result.admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  let body: { id?: string; active?: boolean; nucleo?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const id = String(body.id ?? "");
  const { data: target } = await result.admin.from("profiles").select("role").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  const updates: { active?: boolean; nucleo?: string | null } = {};
  if (typeof body.active === "boolean") updates.active = body.active;
  if (target.role === "operator" && typeof body.nucleo === "string") {
    if (!NUCLEOS.includes(body.nucleo)) return NextResponse.json({ error: "Selecciona un núcleo válido." }, { status: 400 });
    updates.nucleo = body.nucleo;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No hay cambios válidos." }, { status: 400 });
  const { error } = await result.admin.from("profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
