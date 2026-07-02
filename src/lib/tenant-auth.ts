import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production environment.');
  }
  console.warn('WARNING: JWT_SECRET is not set. Using fallback key for development.');
}
const key = new TextEncoder().encode(secretKey || 'rentflow-tenant-portal-secret-key-2026');

export interface TenantSessionData {
  id: string;
  phone: string;
  name: string;
  room_id: string | null;
}

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getTenantSession(): Promise<TenantSessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('tenant-session')?.value;
  if (!session) return null;
  
  try {
    return (await decrypt(session)) as unknown as TenantSessionData;
  } catch {
    return null;
  }
}

export async function setTenantSession(tenantData: TenantSessionData) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const session = await encrypt({ ...tenantData, expires });

  const cookieStore = await cookies();
  cookieStore.set('tenant-session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearTenantSession() {
  const cookieStore = await cookies();
  cookieStore.delete('tenant-session');
}
