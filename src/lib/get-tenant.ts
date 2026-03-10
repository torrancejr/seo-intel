import { headers } from 'next/headers';
import { db } from '@/lib/db';

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
 * Gets the current tenant from request headers (set by middleware)
 * Use this in Server Components and API Routes
 */
export async function getTenant(): Promise<Tenant | null> {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  
  if (!tenantId) {
    return null;
  }
  
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      websiteUrl: true,
      businessDescription: true,
      logoUrl: true,
      planTier: true,
    },
  });
  
  return tenant;
}

/**
 * Gets just the tenant ID from headers
 * Faster alternative when you only need the ID
 */
export async function getTenantId(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-tenant-id');
}

/**
 * Gets tenant info from headers without database query
 * Useful for quick checks
 */
export async function getTenantFromHeaders(): Promise<{
  id: string;
  slug: string;
  name: string;
} | null> {
  const headersList = await headers();
  const id = headersList.get('x-tenant-id');
  const slug = headersList.get('x-tenant-slug');
  const name = headersList.get('x-tenant-name');
  
  if (!id || !slug || !name) {
    return null;
  }
  
  return { id, slug, name };
}
