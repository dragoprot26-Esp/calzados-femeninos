/**
 * cloud.ts - Capa de nube (Supabase) para CyC Calzado Femenino.
 * Molde del ecosistema CyC: base compartida + Auth real + RLS por membresia.
 * Reutiliza validar_licencia / reclamar_tienda / tl_miembros y las funciones
 * propias de esta app (calf_*). Prefijo de datos: CALF. Tabla: calf_backups.
 */

export const SB_URL = 'https://pcxlhgdpxfuybzfsquem.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeGxoZ2RweGZ1eWJ6ZnNxdWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDIyOTQsImV4cCI6MjA5NjE3ODI5NH0.HJWpFO8TkRsmUx15GtSsUusjvVEhUsi5b_QGoPoPU00';

const SESS_KEY = 'calf_sb_sess';
const MAIL_DOM = '@tiendalibre.app';

export interface CloudData {
  tenant?: any;
  products?: any[];
  orders?: any[];
  collaborators?: any[];
  comments?: any[];
  adminSettings?: any;
}

interface SbSession { access_token: string; refresh_token: string; user_id: string | null; expira: number; }

export function emailDe(usuario: string, codigo: string): string {
  const base = ((usuario || '') + '.' + (codigo || '')).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return base + MAIL_DOM;
}
function sessGet(): SbSession | null { try { return JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); } catch (e) { return null; } }
function sessSet(s: SbSession | null) { if (s) localStorage.setItem(SESS_KEY, JSON.stringify(s)); else localStorage.removeItem(SESS_KEY); }
export function estaLogueado(): boolean { return !!sessGet(); }
export function authUserId(): string | null { const s = sessGet(); return s ? s.user_id : null; }

function guardarSesion(d: any): SbSession | null {
  if (!d || !d.access_token) return null;
  const s: SbSession = { access_token: d.access_token, refresh_token: d.refresh_token || '', user_id: (d.user && d.user.id) || d.user_id || null, expira: Date.now() + ((d.expires_in || 3600) * 1000) - 60000 };
  sessSet(s); return s;
}
async function authPost(path: string, body: any) {
  const res = await fetch(SB_URL + path, { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const txt = await res.text(); let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = { raw: txt }; }
  return { ok: res.ok, status: res.status, data };
}
async function signUp(email: string, password: string): Promise<SbSession | null> { const r = await authPost('/auth/v1/signup', { email, password }); if (r.ok && r.data && r.data.access_token) return guardarSesion(r.data); return null; }
async function signIn(email: string, password: string): Promise<SbSession | null> { const r = await authPost('/auth/v1/token?grant_type=password', { email, password }); if (r.ok && r.data && r.data.access_token) return guardarSesion(r.data); return null; }
/**
 * Renueva la sesion CON CANDADO.
 *
 * Supabase cambia el refresh_token cada vez que se usa. Sin candado, dos
 * renovaciones al mismo tiempo (el sondeo + el guardado, o dos pestanas, o el
 * navegador y la app instalada) hacian que la segunda llegara con un token ya
 * gastado: la sesion se moria sola y el panel dejaba de sincronizar sin avisar.
 */
let refrescando: Promise<SbSession | null> | null = null;
const LOCK_KEY = 'calf_sb_refresh';
async function refresh(): Promise<SbSession | null> {
  if (refrescando) return refrescando;
  refrescando = (async () => {
    const s = sessGet(); if (!s || !s.refresh_token) return null;
    try {
      const otra = Number(localStorage.getItem(LOCK_KEY) || 0);
      if (Date.now() - otra < 4000) {
        await new Promise((r) => setTimeout(r, 1600));
        const nueva = sessGet();
        if (nueva && nueva.refresh_token && nueva.refresh_token !== s.refresh_token) return nueva;
      }
      localStorage.setItem(LOCK_KEY, String(Date.now()));
    } catch (e) { /* modo privado */ }
    const actual = sessGet();
    const rt = (actual && actual.refresh_token) || s.refresh_token;
    const r = await authPost('/auth/v1/token?grant_type=refresh_token', { refresh_token: rt });
    if (r.ok && r.data && r.data.access_token) return guardarSesion(r.data);
    return null;
  })();
  try { return await refrescando; }
  finally { setTimeout(() => { refrescando = null; }, 1500); }
}

/** Renueva la sesion ANTES de que venza. El token dura una hora: sin esto, el
 *  panel quedaba abierto, se vencia y de golpe dejaba de sincronizar. */
export async function mantenerSesionViva(): Promise<boolean> {
  const s = sessGet();
  if (!s) return false;
  if (((s.expira || 0) - Date.now()) > 15 * 60 * 1000) return true;
  return !!(await refresh());
}
export async function authToken(): Promise<string | null> { const s = sessGet(); if (!s) return null; if (Date.now() < (s.expira || 0)) return s.access_token; const ns = await refresh(); return ns ? ns.access_token : null; }
export function signOut() { sessSet(null); }
/** Cierra la sesion SOLO en este dispositivo (`scope=local`). Con `global` se
 *  revocaba en TODOS: salir en la PC le mataba la sesion del celular en
 *  silencio, y el otro panel dejaba de leer sin avisar. */
export async function signOutGlobal() {
  try {
    const tok = await authToken();
    if (tok) {
      await fetch(`${SB_URL}/auth/v1/logout?scope=local`, {
        method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + tok },
      });
    }
  } catch (e) { /* noop */ }
  signOut();
}

async function rpc(fn: string, body: any, conAuth = true): Promise<any> {
  const tok = conAuth ? await authToken() : null;
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (tok || SB_KEY), 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || ('rpc ' + fn + ' ' + res.status));
  try { return txt ? JSON.parse(txt) : null; } catch (e) { return txt; }
}

export async function validarLicencia(codigo: string): Promise<any | null> {
  try {
    const d = await rpc('validar_licencia', { p_codigo: codigo }, false);
    if (!d || typeof d !== 'object' || !d.codigo) return null;
    if (d.activa === false) return null;
    if (d.fecha_vencimiento && new Date(d.fecha_vencimiento) < new Date()) return null;
    return d;
  } catch (e) { return null; }
}

export async function asegurarCuentaSeguraDueno(usuario: string, password: string, codigo: string) {
  if (!usuario || !password || !codigo) return { ok: false, msg: 'Faltan datos' };
  const email = emailDe(usuario, codigo);
  let sess = await signIn(email, password);
  if (!sess) { await signUp(email, password); sess = await signIn(email, password); }
  if (!sess) return { ok: false, msg: 'No se pudo crear la cuenta segura (la contrasena debe tener 6+ caracteres).' };
  try { await rpc('sincronizar_clave_dueno', { p_codigo: codigo, p_usuario: usuario, p_pass: password }, false); } catch (e) { /* noop */ }
  try { await rpc('reclamar_tienda', { p_codigo: codigo, p_usuario: usuario }); }
  catch (e: any) { return { ok: false, msg: 'Cuenta creada, pero no se pudo vincular: ' + (e.message || e) }; }
  return { ok: true };
}

export async function asegurarCuentaSeguraColab(usuario: string, password: string, codigo: string) {
  if (!usuario || !password || !codigo) return { ok: false, msg: 'Faltan datos' };
  // La comprobacion contra el listado del local va SIEMPRE PRIMERO, no solo
  // cuando falla el inicio de sesion. Antes, a un colaborador dado de baja le
  // quedaba viva la cuenta y entraba igual: el inicio de sesion funcionaba y
  // nadie volvia a mirar si seguia en el listado.
  let habilitado = false;
  try {
    const r: any = await rpc('calf_verificar_colab', { p_codigo: codigo, p_usuario: usuario, p_pass: password }, false);
    habilitado = !!(r === true || (r && r.ok === true));
  } catch (e) { habilitado = false; }
  if (!habilitado) {
    return { ok: false, msg: 'Usuario o contrasena de colaborador incorrectos, o tu acceso fue dado de baja.' };
  }

  const email = emailDe(usuario, codigo);
  let sess = await signIn(email, password);
  if (!sess) { await signUp(email, password); sess = await signIn(email, password); }
  if (!sess) return { ok: false, msg: 'No se pudo crear la cuenta del colaborador (la clave debe tener 6+ caracteres).' };
  // La contrasena viaja tambien al unir: ahora la comprueba la funcion del
  // servidor. Sin esto, cualquiera con el codigo de la licencia (que va adentro
  // del QR) podia anotarse como colaborador de un local ajeno y leerle -y
  // pisarle- todos los datos.
  try { await rpc('calf_unir_colab', { p_codigo: codigo, p_usuario: usuario, p_pass: password }); }
  catch (e: any) { return { ok: false, msg: 'No se pudo unir: ' + (e.message || e) }; }
  return { ok: true };
}

/** Da de baja el acceso de un colaborador: le saca la MEMBRESIA, no solo el
 *  usuario del listado. */
export async function calfBajaColab(codigo: string, usuario: string): Promise<boolean> {
  if (!codigo || !usuario) return false;
  try { const r = await rpc('calf_baja_colab', { p_codigo: codigo, p_usuario: usuario }); return !!(r && r.ok); }
  catch (e) { return false; }
}

export async function miMembresia(): Promise<{ tenant_id: string; rol: string; usuario: string } | null> {
  const tok = await authToken(); if (!tok) return null;
  const uid = authUserId(); if (!uid) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/tl_miembros?select=tenant_id,rol,usuario&user_id=eq.${uid}`, { cache: 'no-store', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + tok } });
    const rows = r.ok ? await r.json() : [];
    return (rows && rows.length) ? rows[0] : null;
  } catch (e) { return null; }
}

/**
 * Baja los datos del local.
 *
 * `null` = NO SE PUDO LEER (sin sesion, sin senal, permiso denegado).
 * `{}`   = se leyo bien y esta GENUINAMENTE vacio (licencia nueva).
 *
 * OJO, que aca estuvo el problema que en Boutique borro un catalogo entero:
 * antes, sin sesion, la consulta salia igual con la clave ANONIMA. La regla de
 * seguridad respondia `[]` con status 200 y esto devolvia `{}`. La app lo tomaba
 * como "local vacio" y el autoguardado subia ese vacio. Ahora sin sesion no se
 * pregunta, y cero filas se confirma contra calfVersion (que se lee sin permisos):
 * si hay fecha, la fila EXISTE y lo que fallo fue el permiso.
 */
export async function cloudLoad(codigo: string): Promise<CloudData | null> {
  diag.ultimoIntento = Date.now();
  let bearer = await authToken();
  if (!bearer) { await refresh(); bearer = await authToken(); }
  diag.tokenVivo = !!bearer;
  if (!bearer) { diag.ultimoError = 'sin sesion'; return null; }
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/calf_backups?tenant_id=eq.${encodeURIComponent(codigo)}&select=datos&limit=1`,
      { cache: 'no-store', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + bearer } });
    if (!res.ok) { diag.ultimoError = 'HTTP ' + res.status; return null; }
    const rows = await res.json();
    if (!Array.isArray(rows)) { diag.ultimoError = 'respuesta rara'; return null; }

    if (!rows.length) {
      let v = '';
      try { v = await calfVersion(codigo); } catch (e) { v = ''; }
      if (v && v !== '__unknown__') { diag.ultimoError = 'sin permiso sobre este local'; return null; }
      diag.ultimaLectura = Date.now(); diag.ultimoError = '';
      return {};
    }

    diag.ultimaLectura = Date.now(); diag.ultimoError = '';
    return (rows[0].datos || {}) as CloudData;
  } catch (e) { diag.ultimoError = 'sin conexion'; return null; }
}

/** Ultimos datos del sondeo, para poder ver que pasa sin adivinar. */
export const diag = {
  ultimaLectura: 0 as number,
  ultimoIntento: 0 as number,
  ultimoError: '' as string,
  tokenVivo: false as boolean,
};

/** La sesion de nube sigue viva? */
export async function sesionViva(): Promise<boolean> { return !!(await authToken()); }

export async function cloudSave(codigo: string, datos: CloudData): Promise<boolean> {
  // Sin sesion NO se guarda: con la clave anonima la regla de seguridad
  // rechaza siempre, y ese "guardado" que fallaba en silencio hacia creer que
  // los cambios estaban subidos cuando no habia subido nada.
  let bearer = await authToken();
  if (!bearer) { await refresh(); bearer = await authToken(); }
  if (!bearer) return false;
  const enviar = async (tok: string) => fetch(`${SB_URL}/rest/v1/calf_backups`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + tok,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ tenant_id: codigo, datos, updated_at: new Date().toISOString() }),
  });
  try {
    let res = await enviar(bearer);
    // Token vencido (401/403): refrescamos la sesion y reintentamos una vez,
    // asi un guardado no se pierde en silencio.
    if (res.status === 401 || res.status === 403) {
      const ns = await refresh();
      if (ns && ns.access_token) res = await enviar(ns.access_token);
    }
    return res.ok;
  } catch (e) { return false; }
}

export async function calfPublica(codigo: string): Promise<CloudData | null> {
  try { return await rpc('calf_publica', { p_codigo: codigo }, false) as CloudData; } catch (e) { return null; }
}
export async function calfAgregarPedido(codigo: string, pedido: any): Promise<void> {
  try { await rpc('calf_agregar_pedido', { p_codigo: codigo, p_pedido: pedido }, false); } catch (e) { /* noop */ }
}
export async function calfAgregarComentario(codigo: string, comentario: any): Promise<void> {
  try { await rpc('calf_agregar_comentario', { p_codigo: codigo, p_comment: comentario }, false); } catch (e) { /* noop */ }
}

export async function cambiarPasswordDueno(codigo: string, newPassword: string): Promise<{ ok: boolean; msg?: string }> {
  if (!newPassword || newPassword.length < 6) return { ok: false, msg: 'La contraseña debe tener 6+ caracteres.' };
  const tok = await authToken();
  if (!tok) return { ok: false, msg: 'La sesión venció. Salí y volvé a entrar antes de cambiarla.' };
  try {
    const res = await fetch(`${SB_URL}/auth/v1/user`, { method: 'PUT', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) });
    if (!res.ok) { const t = await res.text(); return { ok: false, msg: 'No se pudo cambiar: ' + t }; }
    try { const m = await miMembresia(); if (m && m.usuario) await rpc('sincronizar_clave_dueno', { p_codigo: codigo, p_usuario: m.usuario, p_pass: newPassword }, false); } catch (e) { /* noop */ }
    return { ok: true };
  } catch (e: any) { return { ok: false, msg: e.message || 'Error de red' }; }
}

export async function calfVersion(codigo: string): Promise<string> {
  try { const r = await rpc('calf_version', { p_codigo: codigo }, false); return typeof r === 'string' ? r : String(r || ''); }
  catch (e) { return '__unknown__'; }
}
export async function calfListaColab(codigo: string): Promise<any[]> {
  try { const r = await rpc('calf_lista_colab', { p_codigo: codigo }, false); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}
