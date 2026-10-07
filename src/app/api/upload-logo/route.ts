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
    // Only allow PNG
    if (file.type !== 'image/png') {
      return NextResponse.json({ error: 'Only PNG files are allowed' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const destination = path.join(process.cwd(), 'public', 'icon.png');
    await fs.writeFile(destination, buffer);
    
    // Also save this path to the DB so the layouts know to use it
    const { prisma } = await import('@/lib/prisma');
    await prisma.systemSetting.upsert({
      where: { key: 'clinicLogo' },
      update: { value: '/icon.png' },
      create: { key: 'clinicLogo', value: '/icon.png' }
    });

    // Redirect back to the admin page
    return NextResponse.redirect(new URL('/admin?tab=clinic', request.url), 303);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.redirect(new URL('/admin?tab=clinic&error=1', request.url), 303);
  }
}
