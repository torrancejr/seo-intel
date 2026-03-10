import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const cleanHostname = hostname.split(':')[0];
  
  // Try to resolve tenant by custom domain
  let tenant = await db.tenant.findFirst({
    where: { domain: cleanHostname },
    select: { id: true, slug: true, name: true },
  });
  
  // Try custom domains array
  if (!tenant) {
    tenant = await db.tenant.findFirst({
      where: {
        customDomains: {
          has: cleanHostname,
        },
      },
      select: { id: true, slug: true, name: true },
    });
  }
  
  // Try subdomain resolution
  if (!tenant && cleanHostname.includes('.')) {
    const subdomain = cleanHostname.split('.')[0];
    tenant = await db.tenant.findFirst({
      where: { slug: subdomain },
      select: { id: true, slug: true, name: true },
    });
  }
  
  // Fallback to default tenant
  if (!tenant) {
    tenant = await db.tenant.findFirst({
      where: { slug: 'seointel' },
      select: { id: true, slug: true, name: true },
    });
  }
  
  // Clone the request headers and add tenant info
  const requestHeaders = new Headers(request.headers);
  if (tenant) {
    requestHeaders.set('x-tenant-id', tenant.id);
    requestHeaders.set('x-tenant-slug', tenant.slug);
    requestHeaders.set('x-tenant-name', tenant.name);
  }
  
  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
