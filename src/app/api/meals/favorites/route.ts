import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const meals = await prisma.meal.findMany({
      where: {
        isFavorite: true,
      },
      include: { items: true },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error fetching favorite meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite meals' },
      { status: 500 }
    );
  }
}
