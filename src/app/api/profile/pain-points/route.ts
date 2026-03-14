import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const painPoints = await prisma.painPoint.findMany({
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json(painPoints);
  } catch (error) {
    console.error('Error fetching pain points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pain points' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const painPoints: Array<{
      slug: string;
      label: string;
      description?: string;
      isActive?: boolean;
      priority?: number;
    }> = Array.isArray(body) ? body : [body];

    const results = await Promise.all(
      painPoints.map((pp) =>
        prisma.painPoint.upsert({
          where: {
            slug: pp.slug,
          },
          update: {
            label: pp.label,
            description: pp.description,
            isActive: pp.isActive,
            priority: pp.priority,
          },
          create: {
            slug: pp.slug,
            label: pp.label,
            description: pp.description,
            isActive: pp.isActive ?? true,
            priority: pp.priority ?? 0,
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error creating/updating pain points:', error);
    return NextResponse.json(
      { error: 'Failed to create/update pain points' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slug, ...data } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'slug is required' },
        { status: 400 }
      );
    }

    const painPoint = await prisma.painPoint.update({
      where: {
        slug,
      },
      data,
    });

    return NextResponse.json(painPoint);
  } catch (error) {
    console.error('Error updating pain point:', error);
    return NextResponse.json(
      { error: 'Failed to update pain point' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug query parameter is required' },
        { status: 400 }
      );
    }

    await prisma.painPoint.delete({
      where: {
        slug,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pain point:', error);
    return NextResponse.json(
      { error: 'Failed to delete pain point' },
      { status: 500 }
    );
  }
}
