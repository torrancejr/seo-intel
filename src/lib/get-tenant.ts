import { resolveTenant, getTenantId as getTenantIdFromResolver } from '@/lib/tenant-resolver';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  websiteUrl: string | null;
  businessDescription: string | null;
  logoUrl: string | null;
  planTier: string;
}

/**
 * Gets the current tenant from hostname resolution
 * Use this in Server Components and API Routes
 */
export async function getTenant(): Promise<Tenant | null> {
  return await resolveTenant();
}

/**
 * Gets just the tenant ID from hostname
 * Faster alternative when you only need the ID
 */
export async function getTenantId(): Promise<string | null> {
  return await getTenantIdFromResolver();
}

/**
 * Gets tenant info from hostname resolution
 * Useful for quick checks
 */
export async function getTenantFromHeaders(): Promise<{
  id: string;
  slug: string;
  name: string;
} | null> {
  const tenant = await resolveTenant();
  
  if (!tenant) {
    return null;
  }
  
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
  };
}
