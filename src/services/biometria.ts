/**
 * biometria.ts - Login biometrico de dispositivo (WebAuthn / passkey de plataforma).
 * Molde CyC. Requiere HTTPS. No guarda contraseñas: reabre con la sesión de Supabase.
 */
const KEY = 'calf_bio_v1';

export interface BioMeta { credId: string; licenseCode: string; role: 'admin' | 'collaborator'; colId?: string; name?: string; }

function b64urlFromBuf(buf: ArrayBuffer): string { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function bufFromB64url(str: string): Uint8Array { let s = str.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function rnd(n = 32): Uint8Array { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }

export async function soportada(): Promise<boolean> {
  try { const PKC = (window as any).PublicKeyCredential; if (!('credentials' in navigator) || !PKC) return false; return await PKC.isUserVerifyingPlatformAuthenticatorAvailable(); }
  catch (e) { return false; }
}
export function hay(): boolean { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function leerMeta(): BioMeta | null { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
export function borrar(): void { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } }

export async function registrar(licenseCode: string, usuario: string, role: 'admin' | 'collaborator', colId?: string): Promise<boolean> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: rnd(),
        rp: { name: 'CyC', id: location.hostname },
        user: { id: new TextEncoder().encode((usuario || 'user') + '.' + licenseCode), name: (usuario || 'user') + '@' + licenseCode, displayName: usuario || 'Usuario' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000, attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    const m: BioMeta = { credId: b64urlFromBuf(cred.rawId), licenseCode, role, colId, name: usuario };
    localStorage.setItem(KEY, JSON.stringify(m));
    return true;
  } catch (e) { return false; }
}

export async function desbloquear(): Promise<BioMeta | null> {
  const m = leerMeta();
  if (!m) return null;
  try {
    const assertion = await navigator.credentials.get({ publicKey: { challenge: rnd(), allowCredentials: [{ type: 'public-key', id: bufFromB64url(m.credId) }], userVerification: 'required', timeout: 60000, rpId: location.hostname } });
    return assertion ? m : null;
  } catch (e) { return null; }
}
