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
    
    // Save as icon.png (we keep the name icon.png for consistency, or we could save the actual extension)
    // Next.js metadata uses /icon.png by default, so we overwrite it regardless of format.
    const destination = path.join(process.cwd(), 'public', 'icon.png');
    await fs.writeFile(destination, buffer);
    
    // Also save this path to the DB so the layouts know to use it
    const { prisma } = await import('@/lib/prisma');
    await prisma.systemSetting.upsert({
      where: { key: 'clinicLogo' },
      update: { value: '/icon.png' },
      create: { key: 'clinicLogo', value: '/icon.png' }
    });

    // Fix the redirect URL (avoid 0.0.0.0 from request.url in Docker)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${proto}://${host}` : request.url;

    return NextResponse.redirect(new URL('/admin?tab=clinic', baseUrl), 303);
  } catch (error) {
    console.error('Upload error:', error);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${proto}://${host}` : request.url;
    return NextResponse.redirect(new URL('/admin?tab=clinic&error=1', baseUrl), 303);
  }
}
