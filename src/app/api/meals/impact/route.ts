import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateBGImpact } from '@/lib/data/bgImpact';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mealId } = body;

    // Get user profile for target range
    const profile = await prisma.userProfile.findUnique({ where: { id: 'default' } });
    const targetLow = profile?.targetLow ?? 70;
    const targetHigh = profile?.targetHigh ?? 180;

    // Check if user has "delayed spikes" pain point
    const delayedSpikes = await prisma.painPoint.findFirst({
      where: { slug: 'delayed_spikes', isActive: true },
    });

    let meals;

    if (mealId) {
      const meal = await prisma.meal.findUnique({
        where: { id: mealId },
        include: { items: true },
      });

      if (!meal) {
        return NextResponse.json(
          { error: 'Meal not found' },
          { status: 404 }
        );
      }

      meals = [meal];
    } else {
      meals = await prisma.meal.findMany({
        where: { bgImpactJson: null },
        include: { items: true },
      });
    }

    const updatedMeals = [];

    for (const meal of meals) {
      const mealTime = new Date(meal.timestamp);
      const windowStart = new Date(mealTime.getTime() - 2 * 60 * 60 * 1000);
      const windowEnd = new Date(mealTime.getTime() + 4 * 60 * 60 * 1000);

      const readings = await prisma.glucoseReading.findMany({
        where: {
          timestamp: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (readings.length < 3) {
        continue;
      }

      const impact = calculateBGImpact(
        mealTime,
        readings.map((r) => ({ timestamp: r.timestamp, value: r.value })),
        { targetLow, targetHigh, hasDelayedSpikes: !!delayedSpikes }
      );

      if (!impact) continue;

      const updatedMeal = await prisma.meal.update({
        where: { id: meal.id },
        data: {
          bgImpactJson: JSON.stringify(impact),
          tirScore: impact.tirPercent,
          tirColor: impact.tirPercent >= 70 ? 'green' : impact.tirPercent >= 50 ? 'amber' : 'red',
        },
        include: { items: true },
      });

      updatedMeals.push(updatedMeal);
    }

    return NextResponse.json({
      success: true,
      processed: updatedMeals.length,
      meals: updatedMeals,
    });
  } catch (error) {
    console.error('Error computing BG impact:', error);
    return NextResponse.json(
      { error: 'Failed to compute BG impact' },
      { status: 500 }
    );
  }
}
