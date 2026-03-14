import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const mealType = searchParams.get('mealType');
    const tirColor = searchParams.get('tirColor');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (mealType) {
      where.mealType = mealType;
    }

    if (tirColor) {
      where.tirColor = tirColor;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          items: {
            some: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        where,
        include: { items: true },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.meal.count({ where }),
    ]);

    return NextResponse.json({ meals, total, limit, offset });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, ...mealData } = body;

    // Calculate totals from items if not provided
    if (items && items.length > 0) {
      if (mealData.totalCalories === undefined) {
        mealData.totalCalories = items.reduce(
          (sum: number, item: { calories?: number }) => sum + (item.calories || 0),
          0
        );
      }
      if (mealData.totalCarbs === undefined) {
        mealData.totalCarbs = items.reduce(
          (sum: number, item: { carbs?: number }) => sum + (item.carbs || 0),
          0
        );
      }
      if (mealData.totalProtein === undefined) {
        mealData.totalProtein = items.reduce(
          (sum: number, item: { protein?: number }) => sum + (item.protein || 0),
          0
        );
      }
      if (mealData.totalFat === undefined) {
        mealData.totalFat = items.reduce(
          (sum: number, item: { fat?: number }) => sum + (item.fat || 0),
          0
        );
      }
      if (mealData.totalFiber === undefined) {
        mealData.totalFiber = items.reduce(
          (sum: number, item: { fiber?: number }) => sum + (item.fiber || 0),
          0
        );
      }
    }

    const meal = await prisma.meal.create({
      data: {
        ...mealData,
        timestamp: mealData.timestamp ? new Date(mealData.timestamp) : new Date(),
        items: items
          ? {
              create: items.map((item: Record<string, unknown>) => ({
                ...item,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}
