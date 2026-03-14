import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const meals = await prisma.meal.findMany({
      include: { items: true },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error fetching recent meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent meals' },
      { status: 500 }
    );
  }
}
