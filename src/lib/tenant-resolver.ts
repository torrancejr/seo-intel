import { db } from '@/lib/db';
import { headers } from 'next/headers';

export interface ResolvedTenant {
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
 * Resolves the current tenant based on the request hostname
 * 
 * Resolution order:
 * 1. Custom domain (e.g., blog.caseintel.io)
 * 2. Custom domains array
 * 3. Subdomain (e.g., caseintel.seointel.io)
 * 4. Default tenant (seointel)
 */
export async function resolveTenant(): Promise<ResolvedTenant | null> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  
  // Remove port if present (localhost:3000 -> localhost)
  const hostname = host.split(':')[0];
  
  // Try to find tenant by primary custom domain first
  let tenant = await db.tenant.findFirst({
    where: { domain: hostname },
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
  
  // Try to find by custom domains array
  if (!tenant) {
    tenant = await db.tenant.findFirst({
      where: {
        customDomains: {
          has: hostname,
        },
      },
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
  }
  
  // If not found, try subdomain resolution (subdomain.seointel.io)
  if (!tenant && hostname.includes('.')) {
    const subdomain = hostname.split('.')[0];
    tenant = await db.tenant.findFirst({
      where: { slug: subdomain },
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
  }
  
  // Fallback to default tenant (for localhost and seointel.io)
  if (!tenant) {
    tenant = await db.tenant.findFirst({
      where: { slug: 'seointel' },
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
  }
  
  return tenant;
}

/**
 * Gets tenant ID from hostname (for use in API routes)
 */
export async function getTenantId(): Promise<string | null> {
  const tenant = await resolveTenant();
  return tenant?.id || null;
}

/**
 * Validates that a user belongs to the current tenant
 */
export async function validateTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });
  
  return user?.tenantId === tenantId;
}
