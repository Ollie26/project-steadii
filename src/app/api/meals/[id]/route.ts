import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const meal = await prisma.meal.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Error fetching meal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { items, ...mealData } = body;

    // Check meal exists
    const existing = await prisma.meal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // If items are provided, delete existing and recreate
    if (items) {
      await prisma.mealItem.deleteMany({ where: { mealId: id } });
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...mealData,
        timestamp: mealData.timestamp ? new Date(mealData.timestamp) : undefined,
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

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Error updating meal:', error);
    return NextResponse.json(
      { error: 'Failed to update meal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.meal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Cascade delete: delete items first, then meal
    await prisma.mealItem.deleteMany({ where: { mealId: id } });
    await prisma.meal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json(
      { error: 'Failed to delete meal' },
      { status: 500 }
    );
  }
}
