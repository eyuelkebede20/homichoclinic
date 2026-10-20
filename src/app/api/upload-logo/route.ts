import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('logo') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    // Allow PNG and JPG
    if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
      return NextResponse.json({ error: 'Only PNG and JPG files are allowed' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save as icon.png in public directory
    const destination = path.join(process.cwd(), 'public', 'icon.png');
    await fs.writeFile(destination, buffer);
    
    const timestamp = Date.now();
    const versionedLogo = `/icon.png?v=${timestamp}`;

    // Also save this path with timestamp to the DB so layouts and client components immediately bust cache
    const { prisma } = await import('@/lib/prisma');
    await prisma.systemSetting.upsert({
      where: { key: 'clinicLogo' },
      update: { value: versionedLogo },
      create: { key: 'clinicLogo', value: versionedLogo }
    });

    // Invalidate Next.js Server Component caches across layouts
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'layout');
    revalidatePath('/(dashboard)', 'layout');
    revalidatePath('/admin');

    const accept = request.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return NextResponse.json({ success: true, logoUrl: versionedLogo });
    }

    // Fix the redirect URL (avoid 0.0.0.0 from request.url in Docker)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${proto}://${host}` : request.url;

    return NextResponse.redirect(new URL(`/admin?tab=clinic&t=${timestamp}`, baseUrl), 303);
  } catch (error) {
    console.error('Upload error:', error);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${proto}://${host}` : request.url;
    return NextResponse.redirect(new URL('/admin?tab=clinic&error=1', baseUrl), 303);
  }
}
